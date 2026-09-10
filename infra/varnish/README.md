# Varnish para el storefront

Este servicio se despliega como una aplicación Compose separada en Dokploy. Traefik debe enviar el dominio canónico a `patitas-varnish:80`; el servicio de Next permanece accesible solamente como `patitas-web:3000` dentro de `patitas-production`.

## Configuración de Dokploy

- Compose path: `infra/varnish/docker-compose.yml`.
- Variable secreta obligatoria: `VARNISH_PURGE_SECRET`.
- No publicar puertos del host.
- Dominio apex: backend `patitas-varnish`, puerto `80`, HTTPS con el certificado existente.
- `www` debe redirigir con 308 a `https://patitasinquietas.com.ar`, preservando path y query. El VCL contiene la misma redirección como fallback.
- El API usa `http://patitas-varnish:6081/_cache/xkey`; Traefik nunca debe apuntar al puerto 6081.
- La invalidación usa el `ban` nativo de Varnish, sin módulos externos.
- Las claves compartidas con el API son únicamente `catalog` y `product:<slug>`.

## Cloudflare

Cloudflare conserva TLS, proxy, WAF y la regla existente de imágenes. El HTML no se almacena en el edge: Varnish envía `Cloudflare-CDN-Cache-Control: no-store` para que exista una sola capa de caché documental.

El allowlist cacheable resultante es:

- `/perros` y descendientes
- `/gatos` y descendientes
- `/marcas` y descendientes
- `/producto/:slug`

No se cachean query strings, búsquedas, cookies, autorización, API, rutas privadas, imágenes ni assets de Next. Los documentos `200` viven 12 horas; los `404`, 60 segundos; otros errores no se almacenan.

No crear una regla `Cache Everything` para el dominio ni cachear `/api`, `/auth`, cuenta, carrito, checkout o pedidos en Cloudflare.

El Single Redirect de `www` usa la condición `http.host eq "www.patitasinquietas.com.ar"`, status `308`, destino dinámico `concat("https://patitasinquietas.com.ar", http.request.uri.path)` y `Preserve query string` activado.

El API purga Varnish mediante el listener interno `6081`. Cloudflare no necesita un token de purge mientras el HTML permanezca fuera de su caché.

## Comprobaciones operativas

1. Antes de cambiar Traefik, consultar el servicio internamente con `Host: patitasinquietas.com.ar` y confirmar `MISS` seguido de `HIT`.
2. Confirmar `PASS` con cookie privada, Authorization, query string y requests RSC.
3. Probar un PURGE en el puerto 6081 y comprobar que el siguiente documento vuelve a `MISS`.
4. Cambiar Traefik hacia Varnish y confirmar que Cloudflare informa `CF-Cache-Status: DYNAMIC` o `BYPASS` para HTML.

Rollback: volver a apuntar Traefik directamente a `patitas-web:3000`.
