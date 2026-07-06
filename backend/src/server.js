require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const routes = require("./routes");

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

app.use("/api", routes);

const DIST = path.join(__dirname, "../../frontend/dist");
app.use(express.static(DIST));
app.get(/(.*)/, (_req, res) => res.sendFile(path.join(DIST, "index.html")));

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    app: "MD Logistique Backend",
  });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});