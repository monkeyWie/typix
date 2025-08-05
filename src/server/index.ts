import indexHtml from "../../index.html?raw";
import app from "./api";

import "dotenv/config";

app.get("/*", (c) =>
	c.html(
		indexHtml.replace(
			"</head>",
			`
      <script type="module">
          import RefreshRuntime from "/@react-refresh"
          RefreshRuntime.injectIntoGlobalHook(window)
          window.$RefreshReg$ = () => {}
          window.$RefreshSig$ = () => (type) => type
          window.__vite_plugin_react_preamble_installed__ = true
      </script>
      <script type="module" src="/@vite/client"></script>
    </head>
    `,
		),
	),
);

export default app;
