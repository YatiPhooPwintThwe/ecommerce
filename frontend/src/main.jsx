// src/main.jsx (or index.jsx)
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  createHttpLink,
} from "@apollo/client";
import "./index.css";
import App from "./App.jsx";

// frontend/src/main.jsx
const GRAPHQL_URI = "/graphql";

const httpLink = createHttpLink({
  uri: GRAPHQL_URI,
  credentials: "include",
});

const cache = new InMemoryCache({
  typePolicies: {
    User: {
      keyFields: ["_id"],
      fields: {
        address: {
          read(existing) {
            return existing ?? null;
          },
        },
      },
    },
    Order: { keyFields: ["_id"] },
    Product: { keyFields: ["_id"] }, // ← add
    Coupon: { keyFields: ["_id"] }, // ← add (future-proof)
  },
});

const client = new ApolloClient({
  link: httpLink,
  cache,
  defaultOptions: {
    query: { fetchPolicy: "network-only", errorPolicy: "all" },
    watchQuery: { fetchPolicy: "cache-and-network", errorPolicy: "all" },
    mutate: { errorPolicy: "all" },
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ApolloProvider client={client}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ApolloProvider>
  </React.StrictMode>
);
