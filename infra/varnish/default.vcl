vcl 4.1;

import std;

backend default {
  .host = "patitas-web";
  .port = "3000";
  .connect_timeout = 2s;
  .first_byte_timeout = 20s;
  .between_bytes_timeout = 5s;
  .probe = {
    .url = "/healthz";
    .timeout = 2s;
    .interval = 10s;
    .window = 5;
    .threshold = 3;
    .initial = 3;
  }
}

acl purgers {
  "127.0.0.1";
  "10.0.0.0"/8;
  "172.16.0.0"/12;
  "192.168.0.0"/16;
}

sub vcl_recv {
  if (req.url == "/_varnish/health") {
    if (std.healthy(default)) {
      return (synth(200, "healthy"));
    }
    return (synth(503, "backend unhealthy"));
  }

  if (req.method == "PURGE") {
    if (std.port(local.ip) != 6081) {
      return (synth(405, "PURGE is not available on this listener"));
    }
    if (client.ip !~ purgers) {
      return (synth(403, "Forbidden"));
    }
    if (req.url != "/_cache/xkey") {
      return (synth(404, "Not found"));
    }
    if (!req.http.X-Purge-Token || std.getenv("VARNISH_PURGE_SECRET") == "" || req.http.X-Purge-Token != std.getenv("VARNISH_PURGE_SECRET")) {
      return (synth(403, "Forbidden"));
    }
    if (!req.http.X-Patitas-XKey || req.http.X-Patitas-XKey !~ "^[a-z0-9][a-z0-9:_ -]{0,4095}$") {
      return (synth(400, "Invalid XKey list"));
    }
    ban("obj.http.X-Patitas-Cache-Class == catalog");
    set req.http.X-Purged-Objects = "0";
    return (synth(200, "Purged"));
  }

  if (req.http.host ~ "(?i)^www\\.patitasinquietas\\.com\\.ar(:[0-9]+)?$") {
    return (synth(750, "Canonical redirect"));
  }

  if (req.http.host !~ "(?i)^patitasinquietas\\.com\\.ar(:[0-9]+)?$") {
    return (synth(421, "Misdirected Request"));
  }

  unset req.http.X-Patitas-Cache-Class;
  unset req.http.X-Patitas-Original-Cookie;

  if (req.method != "GET" && req.method != "HEAD") {
    return (pass);
  }
  if (req.http.Authorization || req.http.Upgrade) {
    return (pass);
  }
  if (req.url ~ "\\?") {
    return (pass);
  }
  if (
    req.http.RSC ||
    req.http.Next-Router-State-Tree ||
    req.http.Next-Router-Prefetch ||
    req.http.Next-Router-Segment-Prefetch ||
    req.http.Next-Url ||
    req.http.Purpose ~ "(?i)prefetch" ||
    req.http.Sec-Purpose ~ "(?i)prefetch" ||
    req.http.Accept ~ "(?i)text/x-component"
  ) {
    return (pass);
  }

  if (
    req.url ~ "^/(api|auth|mi-cuenta|carrito|checkout|pedido)(/|$)" ||
    req.url == "/buscar" ||
    req.url == "/healthz"
  ) {
    return (pass);
  }

  if (req.url ~ "^/_next/static/") {
    set req.http.X-Patitas-Cache-Class = "asset";
  } else if (
    req.url == "/" ||
    req.url ~ "^/(perros|gatos)(/|$)" ||
    req.url ~ "^/marcas(/|$)" ||
    req.url ~ "^/producto/[^/]+$" ||
    req.url == "/calculadora-alimento" ||
    req.url == "/sitemap.xml"
  ) {
    set req.http.X-Patitas-Cache-Class = "catalog";
  } else if (
    req.url == "/robots.txt" ||
    req.url == "/pet-shop-caba" ||
    req.url == "/reponer" ||
    req.url ~ "^/guias(/|$)" ||
    req.url ~ "^/(preguntas-frecuentes|envios|cambios-y-devoluciones|contacto|terminos|privacidad|defensa-del-consumidor|arrepentimiento)$"
  ) {
    set req.http.X-Patitas-Cache-Class = "static";
  } else {
    return (pass);
  }

  if (req.http.Cookie) {
    set req.http.X-Patitas-Original-Cookie = req.http.Cookie;
    set req.http.Cookie = regsuball(req.http.Cookie, "(^|;[ \\t]*)patitas-visitor-id=[^;]*", "");
    set req.http.Cookie = regsuball(req.http.Cookie, "^;[ \\t]*", "");
    set req.http.Cookie = regsuball(req.http.Cookie, ";[ \\t]*;", ";");
    if (req.http.Cookie ~ "(^|;[ \\t]*)patitas-") {
      set req.http.Cookie = req.http.X-Patitas-Original-Cookie;
      unset req.http.X-Patitas-Original-Cookie;
      return (pass);
    }
    unset req.http.Cookie;
    unset req.http.X-Patitas-Original-Cookie;
  }

  if (!req.http.X-Forwarded-Proto) {
    set req.http.X-Forwarded-Proto = "https";
  }

  return (hash);
}

sub vcl_backend_response {
  if (!bereq.http.X-Patitas-Cache-Class) {
    return (deliver);
  }

  if (beresp.http.Set-Cookie || beresp.http.Vary == "*") {
    set beresp.uncacheable = true;
    set beresp.ttl = 0s;
    set beresp.http.Cache-Control = "private, no-store";
    set beresp.http.Cloudflare-CDN-Cache-Control = "private, no-store";
    return (deliver);
  }

  if (beresp.status == 200) {
    if (bereq.http.X-Patitas-Cache-Class == "asset") {
      set beresp.ttl = 365d;
      set beresp.grace = 1h;
      set beresp.http.Cache-Control = "public, max-age=31536000, immutable";
      set beresp.http.Cloudflare-CDN-Cache-Control = "public, max-age=31536000, immutable";
    } else if (bereq.http.X-Patitas-Cache-Class == "static") {
      set beresp.ttl = 24h;
      set beresp.grace = 1h;
      set beresp.http.Cache-Control = "public, max-age=0, must-revalidate";
      set beresp.http.Cloudflare-CDN-Cache-Control = "no-store";
    } else {
      set beresp.ttl = 15m;
      set beresp.grace = 1h;
      set beresp.http.Cache-Control = "public, max-age=0, must-revalidate";
      set beresp.http.Cloudflare-CDN-Cache-Control = "no-store";
    }
  } else if (beresp.status == 301 || beresp.status == 308) {
    set beresp.ttl = 1h;
    set beresp.grace = 0s;
    set beresp.http.Cloudflare-CDN-Cache-Control = "no-store";
  } else if (beresp.status == 404 && bereq.http.X-Patitas-Cache-Class != "asset") {
    set beresp.ttl = 1m;
    set beresp.grace = 0s;
    set beresp.http.Cache-Control = "public, max-age=0, must-revalidate";
    set beresp.http.Cloudflare-CDN-Cache-Control = "no-store";
  } else {
    set beresp.uncacheable = true;
    set beresp.ttl = 0s;
    set beresp.http.Cache-Control = "private, no-store";
    set beresp.http.Cloudflare-CDN-Cache-Control = "private, no-store";
    return (deliver);
  }

  set beresp.http.X-Patitas-Cache-Class = bereq.http.X-Patitas-Cache-Class;

  set beresp.http.X-Patitas-Cacheable = "1";
  return (deliver);
}

sub vcl_hit {
  if (obj.ttl >= 0s) {
    return (deliver);
  }
  if (std.healthy(default)) {
    return (miss);
  }
  return (deliver);
}

sub vcl_deliver {
  if (resp.http.X-Patitas-Cacheable == "1") {
    if (obj.hits > 0) {
      set resp.http.X-Varnish-Cache = "HIT";
    } else {
      set resp.http.X-Varnish-Cache = "MISS";
    }
  } else {
    set resp.http.X-Varnish-Cache = "PASS";
  }

  unset resp.http.X-Patitas-Cache-Class;
  unset resp.http.X-Patitas-Cacheable;
}

sub vcl_synth {
  set resp.http.Cache-Control = "no-store";
  set resp.http.Cloudflare-CDN-Cache-Control = "private, no-store";

  if (resp.status == 750) {
    set resp.status = 308;
    set resp.reason = "Permanent Redirect";
    set resp.http.Location = "https://patitasinquietas.com.ar" + req.url;
    return (deliver);
  }

  if (req.method == "PURGE" && resp.status == 200) {
    set resp.http.Content-Type = "application/json; charset=utf-8";
    set resp.http.X-Purged-Objects = req.http.X-Purged-Objects;
    synthetic({"{"ok":true}"});
    return (deliver);
  }

  if (req.url == "/_varnish/health") {
    set resp.http.Content-Type = "application/json; charset=utf-8";
    if (resp.status == 200) {
      synthetic({"{"status":"ok"}"});
    } else {
      synthetic({"{"status":"unhealthy"}"});
    }
    return (deliver);
  }
}
