import { boot } from "https://v2-12-0--edge.netlify.com/bootstrap/index-combined.ts";

const functions = {}; const metadata = { functions: {} };


      try {
        const { default: func } = await import("file:///Users/jasongordon/Desktop/jaydus-saas-AI-dashboard/netlify/edge-functions/ai-stream.ts");

        if (typeof func === "function") {
          functions["ai-stream"] = func;
          metadata.functions["ai-stream"] = {"url":"file:///Users/jasongordon/Desktop/jaydus-saas-AI-dashboard/netlify/edge-functions/ai-stream.ts"}
        } else {
          console.log("⬥ Failed to load Edge Function ai-stream. The file does not seem to have a function as the default export.");
        }
      } catch (error) {
        console.log("⬥ Failed to run Edge Function ai-stream:");
        console.error(error);
      }
      


      try {
        const { default: func } = await import("file:///Users/jasongordon/Desktop/jaydus-saas-AI-dashboard/netlify/edge-functions/openai-stream.ts");

        if (typeof func === "function") {
          functions["openai-stream"] = func;
          metadata.functions["openai-stream"] = {"url":"file:///Users/jasongordon/Desktop/jaydus-saas-AI-dashboard/netlify/edge-functions/openai-stream.ts"}
        } else {
          console.log("⬥ Failed to load Edge Function openai-stream. The file does not seem to have a function as the default export.");
        }
      } catch (error) {
        console.log("⬥ Failed to run Edge Function openai-stream:");
        console.error(error);
      }
      

boot(functions, metadata);