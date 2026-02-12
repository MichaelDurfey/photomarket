import { PassThrough } from "stream";
import { ApolloProvider } from "@apollo/client";

import type { AppLoadContext, EntryContext } from "react-router";
import { createReadableStreamFromReadable } from "@react-router/node";
import { ServerRouter } from "react-router";
import { isbot } from "isbot";
import type { RenderToPipeableStreamOptions } from "react-dom/server";
import { renderToPipeableStream } from "react-dom/server";
import { createServerClient } from "./lib/apollo-client-server";

export const streamTimeout = 5_000;

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  loadContext: AppLoadContext
) {
  // Create Apollo Client for this request FIRST, before any async operations
  const cookieHeader = request.headers.get("cookie") || undefined;
  const apolloClient = createServerClient(cookieHeader);

  // Add Apollo Client to load context IMMEDIATELY - React Router 7 passes this to loaders via context
  // This must be done before renderToPipeableStream is called, as loaders execute during rendering
  (loadContext as any).apolloClient = apolloClient;

  console.log("🔧 loadContext populated in entry.server.tsx");
  console.log("   apolloClient:", apolloClient ? "created" : "MISSING");
  console.log("   loadContext keys:", Object.keys(loadContext));

  return new Promise((resolve, reject) => {
    let shellRendered = false;
    let userAgent = request.headers.get("user-agent");
    let apolloCache: any = null;
    // Ensure requests from bots and SPA Mode renders wait for all content to load before responding
    let readyOption: keyof RenderToPipeableStreamOptions =
      (userAgent && isbot(userAgent)) || routerContext.isSpaMode
        ? "onAllReady"
        : "onShellReady";

    // Abort the rendering stream after the `streamTimeout` so it has time to
    // flush down the rejected boundaries
    let timeoutId: ReturnType<typeof setTimeout> | undefined = setTimeout(
      () => abort(),
      streamTimeout + 1000
    );

    const { pipe, abort } = renderToPipeableStream(
      <ApolloProvider client={apolloClient}>
        <ServerRouter context={routerContext} url={request.url} />
      </ApolloProvider>,
      {
        [readyOption]() {
          shellRendered = true;

          // Extract Apollo cache state
          apolloCache = apolloClient.cache.extract();

          const body = new PassThrough({
            final(callback: () => void) {
              clearTimeout(timeoutId);
              timeoutId = undefined;
              callback();
            },
          });

          // Transform stream to inject Apollo cache script
          let buffer = "";
          const transform = new TransformStream({
            transform(chunk, controller) {
              buffer += new TextDecoder().decode(chunk);

              // Inject script before </body> tag
              if (
                buffer.includes("</body>") &&
                !buffer.includes("__APOLLO_STATE__")
              ) {
                const cacheScript = `<script>window.__APOLLO_STATE__=${JSON.stringify(apolloCache).replace(/</g, "\\u003c")};</script>`;
                buffer = buffer.replace("</body>", `${cacheScript}</body>`);
              }

              controller.enqueue(new TextEncoder().encode(buffer));
              buffer = "";
            },
            flush(controller) {
              if (buffer) {
                controller.enqueue(new TextEncoder().encode(buffer));
              }
            },
          });

          const stream = createReadableStreamFromReadable(body);
          const transformedStream = stream.pipeThrough(transform);

          responseHeaders.set("Content-Type", "text/html");

          pipe(body);

          resolve(
            new Response(transformedStream, {
              headers: responseHeaders,
              status: responseStatusCode,
            })
          );
        },
        onShellError(error: unknown) {
          reject(error);
        },
        onError(error: unknown) {
          responseStatusCode = 500;
          if (shellRendered) {
            console.error(error);
          }
        },
      }
    );
  });
}
