# API as DB Specification

This document specifies the HTTP contract that an external API must implement to be used as a data source by the Express REST API and MCP Server Framework's **API-as-DB** feature. If you are building a custom API (without using this framework's generate command to create the proxy) and want it to work as a "database" behind the framework's proxy, your API must comply with this contract.

## Purpose and audience

This specification is for:

- **Implementers** who build their own REST API (in any language or stack) and want it to be consumed by this framework as an API-as-DB backend.
- **Integrators** who need to verify that an existing API is compatible before connecting it via `npm run generate -- --name X --baseurl <URL> --endpoint <path>`.

If your API satisfies the contract below, the framework can proxy all CRUD and list operations to it, and the generated tests can be used to verify compliance.

## Contract summary

- **Base URL + endpoint:** The framework calls `{baseurl}/{endpoint}` for the collection and `{baseurl}/{endpoint}/{id}` for a single resource. Example: `https://api.example.com` + `products` → `https://api.example.com/products`.
- **Response envelope:** Every successful response body must be a JSON object. It must include a **`data`** property (array for list, object for single resource or create/update/delete). For **list** (GET collection), the response must also include **`totalResult`** (number) so the framework can support count/pagination.
- **Record identity:** Each record must expose a unique identifier as **`_id`** or **`id`** (string or number). The framework uses whichever is present for updates and deletes.
- **Headers:** The framework sends an **`x-tag`** header on every request (value from the app's `API_DB_Key` config). If your backend is another instance of this framework, it will require `x-tag` on POST; custom APIs may accept or ignore it.

## Endpoints reference

| Operation   | HTTP   | URL                | Request                  | Response                            |
| ----------- | ------ | ------------------ | ------------------------ | ----------------------------------- |
| List        | GET    | `/{endpoint}`      | Query params (see below) | `{ data: [], totalResult: number }` |
| Get one     | GET    | `/{endpoint}/{id}` | —                        | `{ data: {} }`                      |
| Create      | POST   | `/{endpoint}`      | Body = document          | `{ data: {} }`                      |
| Update one  | PATCH  | `/{endpoint}/{id}` | Body = partial document  | `{ data: {} }`                      |
| Update many | PUT    | `/{endpoint}`      | Query params + body      | `{ data: {} }`                      |
| Delete one  | DELETE | `/{endpoint}/{id}` | —                        | `{ data: {} }`                      |
| Delete many | DELETE | `/{endpoint}`      | Query params             | `{ data: {} }`                      |

### Example request/response (list)

**Request:**

```http
GET /products?limit=2&sort=-_id HTTP/1.1
Host: api.example.com
x-tag: <value-from-framework>
```

**Response:**

```json
{
  "data": [
    { "_id": "507f1f77bcf86cd799439011", "name": "Widget A", "createdAt": "2025-01-15T10:00:00.000Z" },
    { "_id": "507f1f77bcf86cd799439012", "name": "Widget B", "createdAt": "2025-01-14T09:00:00.000Z" }
  ],
  "totalResult": 42
}
```

### Example request/response (get one)

**Request:**

```http
GET /products/507f1f77bcf86cd799439011 HTTP/1.1
Host: api.example.com
```

**Response:**

```json
{
  "data": { "_id": "507f1f77bcf86cd799439011", "name": "Widget A", "createdAt": "2025-01-15T10:00:00.000Z" }
}
```

### Example request/response (create)

**Request:**

```http
POST /products HTTP/1.1
Host: api.example.com
Content-Type: application/json
x-tag: <value-from-framework>

{"name": "New Widget", "price": 9.99}
```

**Response:**

```json
{
  "data": { "_id": "507f1f77bcf86cd799439013", "name": "New Widget", "price": 9.99, "createdAt": "2025-01-16T12:00:00.000Z" }
}
```

## Query parameters (list / GET collection)

The framework may send these as query parameters on GET `{baseurl}/{endpoint}`. Your API should accept and honor the ones it supports:

| Parameter  | Description                                                                 |
| ---------- | --------------------------------------------------------------------------- |
| `limit`    | Page size (number).                                                         |
| `sort`     | Sort spec, e.g. `-_id` (descending by _id) or `name` (ascending by name).   |
| `select`   | Comma-separated field names for projection (e.g. `name,price`).             |
| `populate` | Related fields to populate (string).                                        |
| `from`     | Start of date range (ISO string; maps from internal `createdAt.$gt`).       |
| `to`       | End of date range (ISO string; maps from internal `createdAt.$lt`).          |
| `lastId`   | Cursor for next page: the `_id` or `id` of the last item from the previous page. |
| `search`   | Search string when the list is used as search.                              |

Other query keys may be filter criteria (e.g. `name=foo`). The framework does **not** send `skip`; pagination is cursor-based via `lastId`.

## Optional: schema discovery

For MCP and schema metadata, the framework can discover your API's schema from:

**GET `{baseurl}/{endpoint}/schema`**

Return a **JSON Schema** object with at least a **`properties`** object (and optionally `required`, `description`). Example:

```json
{
  "type": "object",
  "properties": {
    "id": { "type": "string", "description": "Unique identifier" },
    "name": { "type": "string", "description": "Product name" },
    "createdAt": { "type": "string", "format": "date-time" }
  },
  "required": ["id", "name"]
}
```

If this endpoint is missing or returns an invalid response, the framework falls back to the `_schema` defined in the generated API model file.

## Error handling

On failure, the framework uses `error.response?.data || error`. Your API can return standard HTTP status codes (4xx, 5xx) with a JSON body; that body will be propagated to the framework's error handling.

## Testing for compliance

### Using the generated unit tests (recommended)

Compliance is verified by **running the generated API-based unit tests** against your API:

1. **Generate an API-as-DB service** that points at your API:
   ```bash
   npm run generate -- --name MyProxy --baseurl https://your-api.example.com --endpoint resources
   ```
2. **Start your API** so it is reachable at the given base URL (or use a stub server that implements this spec).
3. **Run the test suite:**
   ```bash
   npm test
   ```
   If your API runs on a different URL/port than the default, set **`TEST_API_BASEURL`**:
   ```bash
   TEST_API_BASEURL=http://localhost:3000 npm test
   ```

The generated controller and route tests call your API and assert response shape (`data`, `totalResult`), status codes, and CRUD behavior. If these tests pass, your API satisfies the contract.

### Optional: manual checklist

If you are not using the framework's generate command to create the proxy service, you can verify compliance with this checklist:

- [ ] **GET collection** returns a JSON object with `data` (array) and `totalResult` (number).
- [ ] **GET `/{endpoint}/{id}`** returns a JSON object with `data` (single object).
- [ ] **POST** to collection accepts a JSON body and returns `{ data: <created object> }`; records include `_id` or `id`.
- [ ] **PATCH** to `/{endpoint}/{id}` accepts a JSON body and returns `{ data: <updated object> }`.
- [ ] **PUT** to collection (with query params and body) returns `{ data: ... }`.
- [ ] **DELETE** to `/{endpoint}/{id}` returns `{ data: ... }`.
- [ ] **DELETE** to collection (with query params) returns `{ data: ... }`.
- [ ] Each record has **`_id`** or **`id`** for identity.
- [ ] (Optional) **GET `/{endpoint}/schema`** returns a JSON Schema object with `properties`.

You can use `curl` or any REST client to run through these points against your base URL and endpoint.
