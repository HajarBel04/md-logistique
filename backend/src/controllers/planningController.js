const prisma = require("../lib/prisma");

async function getPlanning(req, res) {
  try {
    const filter = {};
    if (req.query.date) {
      const date = new Date(req.query.date);
      if (!Number.isNaN(date.getTime())) {
        filter.date = { equals: date };
      }
    }

    const plans = await prisma.planning.findMany({
      where: filter,
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
      include: {
        driver: true,
      },
    });

    const payload = plans.map((plan) => ({
      id: plan.id,
      date: plan.date,
      startTime: plan.startTime,
      endTime: plan.endTime,
      routeName: plan.routeName,
      status: plan.status,
      driverId: plan.driverId,
      driverName: plan.driver?.fullName,
      createdAt: plan.createdAt,
    }));

    return res.json(payload);
  } catch (error) {
    console.error("Erreur get planning:", error);
    return res.status(500).json({ error: "Impossible de récupérer le planning." });
  }
}

async function createPlanning(req, res) {
  try {
    const { driverId, date, startTime, endTime, routeName, status } = req.body;
    if (!driverId || !date || !startTime || !endTime || !routeName) {
      return res.status(400).json({ error: "Les champs driverId, date, startTime, endTime et routeName sont requis." });
    }

    const driver = await prisma.driver.findUnique({ where: { id: driverId } });
    if (!driver) {
      return res.status(404).json({ error: "Chauffeur introuvable." });
    }

    const plan = await prisma.planning.create({
      data: {
        driverId,
        date: new Date(date),
        startTime,
        endTime,
        routeName,
        status: status || "planned",
      },
      include: {
        driver: true,
      },
    });

    return res.status(201).json(plan);
  } catch (error) {
    console.error("Erreur create planning:", error);
    return res.status(500).json({ error: "Impossible de créer l'entrée de planning." });
  }
}

async function updatePlanning(req, res) {
  try {
    const { id } = req.params;
    const { driverId, date, startTime, endTime, routeName, status } = req.body;

    const existing = await prisma.planning.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Entrée de planning introuvable." });
    }

    const data = {
      driverId: driverId ?? existing.driverId,
      date: date ? new Date(date) : existing.date,
      startTime: startTime ?? existing.startTime,
      endTime: endTime ?? existing.endTime,
      routeName: routeName ?? existing.routeName,
      status: status ?? existing.status,
    };

    if (data.driverId !== existing.driverId) {
      const driver = await prisma.driver.findUnique({ where: { id: data.driverId } });
      if (!driver) {
        return res.status(404).json({ error: "Chauffeur introuvable." });
      }
    }

    const plan = await prisma.planning.update({
      where: { id },
      data,
      include: { driver: true },
    });

    return res.json(plan);
  } catch (error) {
    console.error("Erreur update planning:", error);
    return res.status(500).json({ error: "Impossible de mettre à jour le planning." });
  }
}

async function deletePlanning(req, res) {
  try {
    const { id } = req.params;
    const existing = await prisma.planning.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Entrée de planning introuvable." });
    }

    await prisma.planning.delete({ where: { id } });
    return res.json({ success: true });
  } catch (error) {
    console.error("Erreur delete planning:", error);
    return res.status(500).json({ error: "Impossible de supprimer le planning." });
  }
}

module.exports = {
  getPlanning,
  createPlanning,
  updatePlanning,
  deletePlanning,
};
