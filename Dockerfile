# ── HCC computational core ────────────────────────────────────────────────────
# The service is pure Node with NO dependencies — there is no npm install step because
# there is nothing to install, and that is a property worth keeping rather than a gap.
#
# The image carries the atlas as well as the API: / redirects to /HCC/, which serves
# index.html. The API itself needs no browser, no WebGL and no animation frame, so this
# image runs headless on any machine that can run node.
FROM node:22-alpine

# git is here for ONE reason: the provenance block reads the commit at CALL time, so a
# result can name the exact source it came from. Without it every result would carry
# git_commit: null — which is honest, and useless.
RUN apk add --no-cache git

WORKDIR /app
COPY . .

# Fail the BUILD, not the first request, if the extracted kernels have drifted from the
# atlas or any laboratory's self-tests no longer pass. An image that starts and then
# returns wrong numbers is worse than an image that refuses to be built.
RUN node scripts/extract-kernels.mjs --check \
 && node scripts/build-api.mjs \
 && node test/run-tests.mjs

ENV PORT=8974
ENV HCC_MAX_ACTIVE_JOBS=4
ENV HCC_MAX_RETAINED_RUNS=256
EXPOSE 8974

# the health check asks the service the one question it must always be able to answer
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8974)+'/api/v1/health').then(r=>r.ok?process.exit(0):process.exit(1)).catch(()=>process.exit(1))"

USER node
CMD ["node", "server/server.mjs"]
