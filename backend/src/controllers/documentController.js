const prisma = require("../lib/prisma");

function computeStatus(expirationDate) {
  if (!expirationDate) return "valid";
  const now = new Date();
  const expires = new Date(expirationDate);
  const diffDays = Math.ceil((expires - now) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "expired";
  if (diffDays <= 30) return "expiring_soon";
  return "valid";
}

async function getDocuments(req, res) {
  try {
    const documents = await prisma.driverDocument.findMany({
      orderBy: { expirationDate: "asc" },
      include: {
        driver: true,
      },
    });

    const payload = documents.map((document) => ({
      id: document.id,
      type: document.type,
      expirationDate: document.expirationDate,
      status: document.status,
      driverId: document.driverId,
      driverName: document.driver?.fullName,
    }));

    return res.json(payload);
  } catch (error) {
    console.error("Erreur get documents:", error);
    return res.status(500).json({ error: "Impossible de récupérer les documents." });
  }
}

async function createDocument(req, res) {
  try {
    const { type, expirationDate, driverId, status } = req.body;
    if (!type || !driverId) {
      return res.status(400).json({ error: "Le type de document et l'identifiant du chauffeur sont requis." });
    }

    const driver = await prisma.driver.findUnique({ where: { id: driverId } });
    if (!driver) {
      return res.status(404).json({ error: "Chauffeur introuvable." });
    }

    const computedStatus = status || computeStatus(expirationDate);
    const document = await prisma.driverDocument.create({
      data: {
        type,
        expirationDate: expirationDate ? new Date(expirationDate) : null,
        status: computedStatus,
        driverId,
      },
    });

    return res.status(201).json(document);
  } catch (error) {
    console.error("Erreur create document:", error);
    return res.status(500).json({ error: "Impossible de créer le document." });
  }
}

async function updateDocument(req, res) {
  try {
    const { id } = req.params;
    const { type, expirationDate, driverId, status } = req.body;

    const existing = await prisma.driverDocument.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Document introuvable." });
    }

    const updatedStatus = status || computeStatus(expirationDate ?? existing.expirationDate);
    const document = await prisma.driverDocument.update({
      where: { id },
      data: {
        type: type ?? existing.type,
        expirationDate: expirationDate ? new Date(expirationDate) : expirationDate === null ? null : existing.expirationDate,
        status: updatedStatus,
        driverId: driverId ?? existing.driverId,
      },
    });

    return res.json(document);
  } catch (error) {
    console.error("Erreur update document:", error);
    return res.status(500).json({ error: "Impossible de mettre à jour le document." });
  }
}

async function deleteDocument(req, res) {
  try {
    const { id } = req.params;
    const existing = await prisma.driverDocument.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Document introuvable." });
    }

    await prisma.driverDocument.delete({ where: { id } });
    return res.json({ success: true });
  } catch (error) {
    console.error("Erreur delete document:", error);
    return res.status(500).json({ error: "Impossible de supprimer le document." });
  }
}

module.exports = {
  getDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
};
