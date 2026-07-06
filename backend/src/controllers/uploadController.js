const path = require("path");
const { parseWebfleetFile } = require("../webfleetParser");
const prisma = require("../lib/prisma");

async function uploadWebfleet(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Aucun fichier envoyé" });
    }

    const filePath = req.file.path;
    const originalName = req.file.originalname;
    const result = parseWebfleetFile(filePath);

    if (!prisma) {
      return res.json({
        message: "Fichier analysé (base de données indisponible — npx prisma generate requis)",
        result,
        saved: null,
      });
    }

    const driver = await prisma.driver.upsert({
      where: { fullName: result.driverName },
      update: {},
      create: { fullName: result.driverName },
    });

    const existingImport = await prisma.webfleetImport.findFirst({
      where: {
        fileName: originalName,
        driverId: driver.id,
      },
      include: {
        driver: true,
        summary: true,
      },
    });

    if (existingImport) {
      return res.json({
        message: "Ce fichier a déjà été importé",
        duplicate: true,
        saved: existingImport,
      });
    }

    const webfleetImport = await prisma.webfleetImport.create({
      data: {
        fileName: originalName,
        driverId: driver.id,
        summary: {
          create: {
            conduiteHeures: result.totals.conduiteHeures,
            travailHeures: result.totals.travailHeures,
            heuresTravaillees: result.totals.heuresTravaillees,
            reposHeures: result.totals.reposHeures,
            disponibiliteHeures: result.totals.disponibiliteHeures,
            totalHeures: result.totals.totalHeures,
          },
        },
      },
      include: {
        driver: true,
        summary: true,
      },
    });

    return res.json({
      message: "Fichier Webfleet importé et sauvegardé avec succès",
      file: {
        name: originalName,
        path: filePath,
        extension: path.extname(originalName),
      },
      result,
      saved: webfleetImport,
    });
  } catch (error) {
    console.error("Erreur upload Webfleet:");
    console.error(error);
    console.error(error.stack);

    return res.status(500).json({
      error: "Erreur lors du traitement du fichier Webfleet",
      details: error.message,
      code: error.code,
      meta: error.meta,
    });
  }
}

module.exports = {
  uploadWebfleet,
};
