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

const { findConfig, loadConfigs } = require("./chauffeurConfig");
const prisma = require("./lib/prisma");

const router = express.Router();

const upload = multer({
  dest: "uploads/",
});

const requireDB = (req, res, next) => {
  if (!prisma) {
    return res.status(503).json({
      error: "Base de données indisponible. Libère de l'espace disque puis relance : npx prisma generate",
    });
  }
  next();
};

router.post("/upload-webfleet", upload.single("file"), uploadWebfleet);

// Retourne la config domicile/dépôt de tous les chauffeurs
router.get("/chauffeur-configs", (req, res) => {
  const configs = loadConfigs();
  res.json(configs.map(c => ({
    name: c.sheetName,
    homeCity: c.homeCity,
    depotKeyword: c.depotKeyword,
  })));
});

router.get("/alex/dashboard", requireDB, getAlexDashboard);
router.get("/alex/imports", requireDB, getAlexImports);
router.get("/alex/imports/:id", requireDB, getAlexImportById);

router.get("/alex/drivers", requireDB, getDrivers);
router.get("/alex/drivers/:id", requireDB, getDriverById);
router.post("/alex/drivers", requireDB, createDriver);
router.put("/alex/drivers/:id", requireDB, updateDriver);
router.delete("/alex/drivers/:id", requireDB, deleteDriver);

router.get("/alex/documents", requireDB, getDocuments);
router.post("/alex/documents", requireDB, createDocument);
router.put("/alex/documents/:id", requireDB, updateDocument);
router.delete("/alex/documents/:id", requireDB, deleteDocument);

router.get("/alex/planning", requireDB, getPlanning);
router.post("/alex/planning", requireDB, createPlanning);
router.put("/alex/planning/:id", requireDB, updatePlanning);
router.delete("/alex/planning/:id", requireDB, deletePlanning);

module.exports = router;