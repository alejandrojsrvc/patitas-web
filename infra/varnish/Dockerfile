FROM varnish:7.7-alpine

COPY default.vcl /etc/varnish/default.vcl

EXPOSE 80 6081

HEALTHCHECK --interval=10s --timeout=3s --start-period=15s --retries=3 \
  CMD wget -q -O - http://127.0.0.1:80/_varnish/health > /dev/null || exit 1

WORKDIR /etc/varnish

CMD ["varnishd", "-F", "-f", "/etc/varnish/default.vcl", "-a", ":80,HTTP", "-a", ":6081,HTTP", "-s", "malloc,256M"]
