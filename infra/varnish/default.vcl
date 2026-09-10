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
      return (synth(200, "OK"));
    }
    return (synth(503, "Backend unhealthy"));
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
      return (synth(400, "Invalid cache key"));
    }

    ban("obj.http.X-Patitas-Cache-Key ~ " + regsuball(req.http.X-Patitas-XKey, " ", "|"));
    return (synth(200, "Purged"));
  }

  if (req.http.host ~ "(?i)^www\.patitasinquietas\.com\.ar(:[0-9]+)?$") {
    return (synth(750, "Canonical redirect"));
  }

  if (req.http.host !~ "(?i)^patitasinquietas\.com\.ar(:[0-9]+)?$") {
    return (synth(421, "Misdirected Request"));
  }

  if (req.method != "GET" && req.method != "HEAD") {
    return (pass);
  }

  if (req.http.Authorization || req.http.Cookie) {
    return (pass);
  }

  if (req.url ~ "\?") {
    return (pass);
  }

  if (req.url ~ "^/(perros|gatos|marcas)(/.*)?$") {
    set req.http.X-Patitas-Cache-Class = "catalog";
  } else if (req.url ~ "^/producto/[^/]+$") {
    set req.http.X-Patitas-Cache-Class = "product";
  } else {
    return (pass);
  }

  if (!req.http.X-Forwarded-Proto) {
    set req.http.X-Forwarded-Proto = "https";
  }

  return (hash);
}

sub vcl_backend_response {
  if (!bereq.http.X-Patitas-Cache-Class) {
    set beresp.uncacheable = true;
    set beresp.ttl = 0s;
    return (deliver);
  }

  if (beresp.http.Content-Type !~ "(?i)text/html") {
    set beresp.uncacheable = true;
    set beresp.ttl = 0s;
    return (deliver);
  }

  if (beresp.status == 200) {
    set beresp.ttl = 12h;
    set beresp.grace = 1h;
    set beresp.http.Cache-Control = "public, max-age=43200";
    set beresp.http.Cloudflare-CDN-Cache-Control = "no-store";
  } else if (beresp.status == 404) {
    set beresp.ttl = 60s;
    set beresp.grace = 0s;
    set beresp.http.Cache-Control = "public, max-age=60";
    set beresp.http.Cloudflare-CDN-Cache-Control = "no-store";
  } else {
    set beresp.uncacheable = true;
    set beresp.ttl = 0s;
    return (deliver);
  }

  set beresp.http.X-Patitas-Cache-Key = "catalog";
  if (bereq.http.X-Patitas-Cache-Class == "product") {
    set beresp.http.X-Patitas-Cache-Key = "catalog product:" + regsub(bereq.url, "^/producto/", "");
  }

  set beresp.http.X-Patitas-Cacheable = "1";
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

  unset resp.http.X-Patitas-Cache-Key;
  unset resp.http.X-Patitas-Cacheable;
}

sub vcl_synth {
  set resp.http.Cache-Control = "no-store";

  if (resp.status == 750) {
    set resp.status = 308;
    set resp.reason = "Permanent Redirect";
    set resp.http.Location = "https://patitasinquietas.com.ar" + req.url;
    synthetic("redirect");
    return (deliver);
  }

  if (req.method == "PURGE" && resp.status == 200) {
    set resp.http.Content-Type = "text/plain; charset=utf-8";
    synthetic("ok");
    return (deliver);
  }

  if (req.url == "/_varnish/health") {
    set resp.http.Content-Type = "text/plain; charset=utf-8";
    if (resp.status == 200) {
      synthetic("healthy");
    } else {
      synthetic("unhealthy");
    }
    return (deliver);
  }

  synthetic(resp.reason);
  return (deliver);
}
