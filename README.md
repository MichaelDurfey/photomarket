# Photo Store

This is a small photo store built with React Router, React, and a GraphQL backend. It lets you browse and sell photos, with optional integration to an Adobe Lightroom catalog so you can serve images directly from your own albums.

To run the app in development, start the GraphQL API from the `backend` directory (`npm install` then `npm run dev`), and then from the project root run `npm install` and `npm run dev` to start the React Router frontend. The frontend talks to the backend’s `/graphql` endpoint; if you change ports or enable HTTPS, update your environment variables accordingly.

For details about the API schema, HTTPS configuration, and Adobe Lightroom setup (including OAuth and tokens), see the documentation in the `backend` folder, especially `README.md` and `README_ADOBE.md`.
