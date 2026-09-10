FROM varnish:6.0.18-1@sha256:89d3255fadd980d5c7051f8139cacb80f4f633bc2b4a42707a42b89ddbad73a5

USER root

ARG VARNISH_MODULES_COMMIT=d472c29300ffa1ea5d0916125d449ba43a64f1bd

RUN set -eux; \
    build_deps="automake build-essential ca-certificates curl libtool pkg-config python3-docutils varnish-dev"; \
    apt-get update; \
    apt-get install -y --no-install-recommends ${build_deps}; \
    curl --fail --location --silent --show-error \
      "https://github.com/varnish/varnish-modules/archive/${VARNISH_MODULES_COMMIT}.tar.gz" \
      --output /tmp/varnish-modules.tar.gz; \
    mkdir /tmp/varnish-modules; \
    tar --extract --gzip --file /tmp/varnish-modules.tar.gz --directory /tmp/varnish-modules --strip-components=1; \
    cd /tmp/varnish-modules; \
    ./bootstrap; \
    ./configure; \
    make -j2; \
    make check -j2; \
    make install; \
    apt-mark manual ca-certificates curl; \
    apt-get purge -y --auto-remove automake build-essential libtool pkg-config python3-docutils varnish-dev; \
    rm -rf /tmp/varnish-modules /tmp/varnish-modules.tar.gz /var/lib/apt/lists/*

COPY default.vcl /etc/varnish/default.vcl

RUN sed 's/\.host = "patitas-web";/\.host = "127.0.0.1";/' /etc/varnish/default.vcl > /tmp/default-check.vcl \
  && VARNISH_PURGE_SECRET=build-check varnishd -C -f /tmp/default-check.vcl > /dev/null \
  && rm /tmp/default-check.vcl

ENV VARNISH_SIZE=256M
ENV VARNISH_HTTP_PORT=80

EXPOSE 80 6081

HEALTHCHECK --interval=10s --timeout=3s --start-period=15s --retries=3 \
  CMD curl --fail --silent --show-error http://127.0.0.1/_varnish/health > /dev/null || exit 1

CMD ["-a", ":6081,HTTP"]
