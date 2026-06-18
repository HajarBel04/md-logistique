const express = require("express");
const multer = require("multer");
const { uploadWebfleet } = require("./controllers/uploadController");
const {
  getAlexDashboard,
  getAlexImports,
  getAlexImportById,
} = require("./controllers/alexController");
const {
  getDrivers,
  getDriverById,
  createDriver,
  updateDriver,
  deleteDriver,
} = require("./controllers/driverController");
const {
  getDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
} = require("./controllers/documentController");
const {
  getPlanning,
  createPlanning,
  updatePlanning,
  deletePlanning,
} = require("./controllers/planningController");

const router = express.Router();

const upload = multer({
  dest: "uploads/",
});

router.post("/upload-webfleet", upload.single("file"), uploadWebfleet);

router.get("/alex/dashboard", getAlexDashboard);
router.get("/alex/imports", getAlexImports);
router.get("/alex/imports/:id", getAlexImportById);

router.get("/alex/drivers", getDrivers);
router.get("/alex/drivers/:id", getDriverById);
router.post("/alex/drivers", createDriver);
router.put("/alex/drivers/:id", updateDriver);
router.delete("/alex/drivers/:id", deleteDriver);

router.get("/alex/documents", getDocuments);
router.post("/alex/documents", createDocument);
router.put("/alex/documents/:id", updateDocument);
router.delete("/alex/documents/:id", deleteDocument);

router.get("/alex/planning", getPlanning);
router.post("/alex/planning", createPlanning);
router.put("/alex/planning/:id", updatePlanning);
router.delete("/alex/planning/:id", deletePlanning);

module.exports = router;