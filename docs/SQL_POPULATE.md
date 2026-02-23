# Populate on SQL-based endpoints

SQL-based endpoints (generated with `--sql`) support a **`populate`** query parameter on GET requests. It tells Sequelize to **include** related records (JOIN) so the response contains the full related row(s) instead of only the foreign key.

The generated template includes one example reference field, **`toPop`**, which is a self-reference (e.g. Order → Order). You can add more reference fields and make them work with `?populate=...` by defining the column and the Sequelize **association**, and following the convention below.

---

## How populate is resolved

The controller interprets each value in `populate` in two ways:

1. **Model name** — If the value equals a **registered model name** (e.g. `Orders`, `Items`), it is treated as “include this model”. Use this when you have a relation to another table/model (e.g. Order → User).
2. **Reference field name** — If the value is **not** a model name, it is treated as a **column name** on the current model (e.g. `toPop`, `userId`). The controller then uses a **convention**: it includes the **current model** with alias **`<field>Ref`** and **`foreignKey: <field>`**. So you must define the matching association in your SQL model.

---

## Making a new reference field work with populate

### 1. Add the column to the schema

In your SQL model file (e.g. `src/models/Orders.ts`), add a column for the foreign key:

```ts
// Example: reference to another Order (self-reference)
parentOrderId: {
  type: DataTypes.INTEGER,
  description: 'Parent order ID',
  mcpDescription: 'Reference to another Order.'
}

// Example: reference to a User model
userId: {
  type: DataTypes.INTEGER,
  description: 'User who created the order',
  mcpDescription: 'Reference to User.'
}
```

Add the same fields to the TypeScript attributes interface if you have one.

### 2. Define the Sequelize association

In the same model file, in the **`associate`** function, define how the relation is joined:

**Self-reference (same table):**

```ts
// Convention: alias = '<fieldName>Ref', foreignKey = '<fieldName>'
Orders.associate = function (_models: any): void {
  Orders.belongsTo(Orders, { as: 'toPopRef', foreignKey: 'toPop' });
  Orders.belongsTo(Orders, { as: 'parentOrderIdRef', foreignKey: 'parentOrderId' });
};
```

**Reference to another model:**

```ts
Orders.associate = function (models: any): void {
  Orders.belongsTo(Orders, { as: 'toPopRef', foreignKey: 'toPop' });
  // Use the other model's name (as registered in src/models/index.js)
  Orders.belongsTo(models.Users, { as: 'user', foreignKey: 'userId' });
};
```

For **reference fields** (option 2 in “How populate is resolved” above), the controller only knows about the convention: alias = **`<field>Ref`**, same model, `foreignKey: <field>`. So:

- **Self-references:** Use `Model.belongsTo(Model, { as: '<field>Ref', foreignKey: '<field>' })` so the controller’s automatic include works.
- **References to another model:** You must use the **model name** in `populate` (e.g. `?populate=Users`), and the association must be defined as above (e.g. `Orders.belongsTo(models.Users, { as: 'Users', foreignKey: 'userId' })` so that the key in the query matches the registered model name). If you use a different `as`, the controller’s generic logic may not add the include for that model name; in that case you’d need to extend the controller to handle that relation explicitly.

So for **minimal changes** and to “make populate work for other fields” on the same table, stick to **self-references** and the `<field>Ref` convention.

### 3. Use populate in requests

- **Self-reference (field name):**  
  `GET /orders?populate=toPop`  
  `GET /orders/1?populate=toPop`  
  The related order appears in the response under **`toPopRef`** (the raw id stays in **`toPop`**).

- **Multiple fields:**  
  `GET /orders?populate=toPop parentOrderId`  
  Each listed field must have an association with alias **`<field>Ref`** and **`foreignKey: <field>`**.

- **By model name (other table):**  
  `GET /orders?populate=Users`  
  Only works if you defined `Orders.belongsTo(models.Users, ...)` and the controller’s include logic uses the same model name.

---

## Summary

| Goal                         | What to do |
|-----------------------------|------------|
| Add a **self-reference**    | Add column (e.g. `parentOrderId`), then `Model.belongsTo(Model, { as: 'parentOrderIdRef', foreignKey: 'parentOrderId' })`. Use `?populate=parentOrderId`. |
| Add a **reference to another table** | Add column (e.g. `userId`), then `Model.belongsTo(models.OtherModel, { as: 'OtherModel', foreignKey: 'userId' })`. Use `?populate=OtherModel` (model name as registered). |
| Convention for **field-based** populate | Alias must be **`<field>Ref`**, **`foreignKey`** must be **`<field>`**. The generated controller uses this to build the Sequelize `include`. |

The **`toPop`** field in the SQL template is only an example; you can add as many reference fields as you need, following the same pattern and convention.
