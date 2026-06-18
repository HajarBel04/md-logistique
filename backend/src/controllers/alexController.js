const prisma = require("../lib/prisma");

async function getAlexDashboard(req, res) {
  try {
    const totalDrivers = await prisma.driver.count();
    const totalImports = await prisma.webfleetImport.count();

    const totals = await prisma.payrollSummary.aggregate({
      _sum: {
        heuresTravaillees: true,
        conduiteHeures: true,
        reposHeures: true,
        disponibiliteHeures: true,
      },
    });

    const totalDocuments = await prisma.driverDocument.count();
    const totalPlanning = await prisma.planning.count();

    const lastDocuments = await prisma.driverDocument.findMany({
      orderBy: { expirationDate: 'asc' },
      take: 5,
      include: {
        driver: {
          select: {
            fullName: true,
          },
        },
      },
    });

    const upcomingPlanning = await prisma.planning.findMany({
      where: {
        date: {
          gte: new Date(),
        },
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      take: 5,
      include: {
        driver: {
          select: {
            fullName: true,
          },
        },
      },
    });

    const lastImports = await prisma.webfleetImport.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        fileName: true,
        createdAt: true,
        driver: {
          select: {
            fullName: true,
          },
        },
        summary: {
          select: {
            conduiteHeures: true,
            travailHeures: true,
            heuresTravaillees: true,
            reposHeures: true,
            disponibiliteHeures: true,
            totalHeures: true,
          },
        },
      },
    });

    return res.json({
      totalDrivers,
      totalImports,
      totalDocuments,
      totalPlanning,
      totalWorkedHours: totals._sum.heuresTravaillees ?? 0,
      totalDrivingHours: totals._sum.conduiteHeures ?? 0,
      totalRestHours: totals._sum.reposHeures ?? 0,
      totalAvailableHours: totals._sum.disponibiliteHeures ?? 0,
      lastImports,
      lastDocuments: lastDocuments.map((document) => ({
        id: document.id,
        type: document.type,
        expirationDate: document.expirationDate,
        status: document.status,
        driverName: document.driver?.fullName,
      })),
      upcomingPlanning: upcomingPlanning.map((plan) => ({
        id: plan.id,
        date: plan.date,
        startTime: plan.startTime,
        endTime: plan.endTime,
        routeName: plan.routeName,
        status: plan.status,
        driverName: plan.driver?.fullName,
      })),
    });
  } catch (error) {
    console.error("Erreur Alex dashboard:", error);
    return res.status(500).json({
      error: "Impossible de récupérer le tableau de bord Alex",
      details: error.message,
    });
  }
}

async function getAlexImports(req, res) {
  try {
    const imports = await prisma.webfleetImport.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        fileName: true,
        createdAt: true,
        driver: {
          select: {
            fullName: true,
          },
        },
        summary: {
          select: {
            conduiteHeures: true,
            travailHeures: true,
            heuresTravaillees: true,
            reposHeures: true,
            disponibiliteHeures: true,
            totalHeures: true,
          },
        },
      },
    });

    return res.json(imports);
  } catch (error) {
    console.error("Erreur Alex imports:", error);
    return res.status(500).json({
      error: "Impossible de récupérer les imports Webfleet",
      details: error.message,
    });
  }
}

async function getAlexImportById(req, res) {
  try {
    const { id } = req.params;
    const webfleetImport = await prisma.webfleetImport.findUnique({
      where: { id },
      include: {
        driver: true,
        summary: true,
      },
    });

    if (!webfleetImport) {
      return res.status(404).json({ error: "Import introuvable." });
    }

    return res.json(webfleetImport);
  } catch (error) {
    console.error("Erreur Alex import by id:", error);
    return res.status(500).json({
      error: "Impossible de récupérer l'import.",
      details: error.message,
    });
  }
}

async function getAlexDrivers(req, res) {
  try {
    const drivers = await prisma.driver.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        imports: {
          include: {
            summary: true,
          },
        },
        documents: true,
      },
    });

    const payload = drivers.map((driver) => {
      const totalWorkedHours = driver.imports.reduce((sum, webfleetImport) => {
        return sum + (webfleetImport.summary?.heuresTravaillees ?? 0);
      }, 0);

      return {
        id: driver.id,
        fullName: driver.fullName,
        phone: driver.phone,
        vehicle: driver.vehicle,
        createdAt: driver.createdAt,
        totalWorkedHours,
        imports: driver.imports.map((webfleetImport) => ({
          id: webfleetImport.id,
          fileName: webfleetImport.fileName,
          createdAt: webfleetImport.createdAt,
          summary: webfleetImport.summary
            ? {
                conduiteHeures: webfleetImport.summary.conduiteHeures,
                travailHeures: webfleetImport.summary.travailHeures,
                heuresTravaillees: webfleetImport.summary.heuresTravaillees,
                reposHeures: webfleetImport.summary.reposHeures,
                disponibiliteHeures: webfleetImport.summary.disponibiliteHeures,
                totalHeures: webfleetImport.summary.totalHeures,
              }
            : null,
        })),
        documents: driver.documents.map((document) => ({
          id: document.id,
          type: document.type,
          expirationDate: document.expirationDate,
          status: document.status,
        })),
      };
    });

    return res.json(payload);
  } catch (error) {
    console.error("Erreur Alex drivers:", error);
    return res.status(500).json({
      error: "Impossible de récupérer les chauffeurs Alex",
      details: error.message,
    });
  }
}

module.exports = {
  getAlexDashboard,
  getAlexImports,
  getAlexImportById,
  getAlexDrivers,
};
