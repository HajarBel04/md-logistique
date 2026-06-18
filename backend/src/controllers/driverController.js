const prisma = require("../lib/prisma");

async function getDrivers(req, res) {
  try {
    const drivers = await prisma.driver.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        imports: {
          select: {
            summary: true,
          },
        },
      },
    });

    const payload = drivers.map((driver) => ({
      id: driver.id,
      fullName: driver.fullName,
      phone: driver.phone,
      vehicle: driver.vehicle,
      createdAt: driver.createdAt,
      importsCount: driver.imports.length,
      totalWorkedHours: driver.imports.reduce((sum, item) => sum + (item.summary?.heuresTravaillees ?? 0), 0),
    }));

    return res.json(payload);
  } catch (error) {
    console.error("Erreur get drivers:", error);
    return res.status(500).json({ error: "Impossible de récupérer les chauffeurs." });
  }
}

async function getDriverById(req, res) {
  try {
    const { id } = req.params;
    const driver = await prisma.driver.findUnique({
      where: { id },
      include: {
        imports: {
          orderBy: { createdAt: "desc" },
          include: { summary: true },
        },
        documents: true,
        plannings: {
          orderBy: [{ date: "asc" }, { startTime: "asc" }],
        },
      },
    });

    if (!driver) {
      return res.status(404).json({ error: "Chauffeur introuvable." });
    }

    const payload = {
      id: driver.id,
      fullName: driver.fullName,
      phone: driver.phone,
      vehicle: driver.vehicle,
      createdAt: driver.createdAt,
      imports: driver.imports.map((item) => ({
        id: item.id,
        createdAt: item.createdAt,
        summary: item.summary,
      })),
      documents: driver.documents,
      plannings: driver.plannings,
      importsCount: driver.imports.length,
      totalWorkedHours: driver.imports.reduce((sum, item) => sum + (item.summary?.heuresTravaillees ?? 0), 0),
    };

    return res.json(payload);
  } catch (error) {
    console.error("Erreur get driver:", error);
    return res.status(500).json({ error: "Impossible de récupérer le chauffeur." });
  }
}

async function createDriver(req, res) {
  try {
    const { fullName, phone, vehicle } = req.body;
    if (!fullName) {
      return res.status(400).json({ error: "Le nom complet du chauffeur est requis." });
    }

    const existing = await prisma.driver.findUnique({ where: { fullName } });
    if (existing) {
      return res.status(409).json({ error: "Un chauffeur avec ce nom existe déjà." });
    }

    const driver = await prisma.driver.create({
      data: {
        fullName,
        phone,
        vehicle,
      },
    });

    return res.status(201).json(driver);
  } catch (error) {
    console.error("Erreur create driver:", error);
    return res.status(500).json({ error: "Impossible de créer le chauffeur." });
  }
}

async function updateDriver(req, res) {
  try {
    const { id } = req.params;
    const { fullName, phone, vehicle } = req.body;

    const driver = await prisma.driver.findUnique({ where: { id } });
    if (!driver) {
      return res.status(404).json({ error: "Chauffeur introuvable." });
    }

    const updated = await prisma.driver.update({
      where: { id },
      data: {
        fullName: fullName ?? driver.fullName,
        phone: phone ?? driver.phone,
        vehicle: vehicle ?? driver.vehicle,
      },
    });

    return res.json(updated);
  } catch (error) {
    console.error("Erreur update driver:", error);
    return res.status(500).json({ error: "Impossible de mettre à jour le chauffeur." });
  }
}

async function deleteDriver(req, res) {
  try {
    const { id } = req.params;
    const existing = await prisma.driver.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ error: "Chauffeur introuvable." });
    }

    await prisma.driver.delete({ where: { id } });
    return res.json({ success: true });
  } catch (error) {
    console.error("Erreur delete driver:", error);
    return res.status(500).json({ error: "Impossible de supprimer le chauffeur." });
  }
}

module.exports = {
  getDrivers,
  getDriverById,
  createDriver,
  updateDriver,
  deleteDriver,
};
