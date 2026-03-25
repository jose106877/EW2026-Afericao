const express = require("express");
const mongoose = require("mongoose");
const app = express();

app.use(express.json());

// Logger simples
app.use(function (req, res, next) {
  var d = new Date().toISOString().substring(0, 16);
  console.log(req.method + " " + req.url + " " + d);
  next();
});

// 1) Conexao ao MongoDB
const nomeBD = "autoRepair";
const mongoHost =
  process.env.MONGO_URL || `mongodb://127.0.0.1:27017/${nomeBD}`;
mongoose
  .connect(mongoHost)
  .then(() => console.log(`MongoDB: liguei-me à base de dados ${nomeBD}.`))
  .catch((err) => console.error("Erro:", err));

// 2) Esquema flexivel para a colecao repairs
const repairSchema = new mongoose.Schema(
  {},
  { strict: false, collection: "repairs", versionKey: false },
);
const Repair = mongoose.model("Repair", repairSchema);

// GET /repairs
// GET /repairs?ano=YYYY
// GET /repairs?marca=VRUM
app.get("/repairs", async (req, res) => {
  try {
    const { ano, marca } = req.query;
    const filtro = {};

    if (ano) {
      filtro.data = new RegExp(`^${ano}-`);
    }
    if (marca) {
      filtro["viatura.marca"] = marca;
    }

    const repairs = await Repair.find(filtro).exec();
    res.json(repairs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const listarMatriculas = async (req, res) => {
  try {
    const matriculas = await Repair.distinct("viatura.matricula");
    const lista = matriculas
      .filter((m) => typeof m === "string" && m.trim() !== "")
      .sort((a, b) => a.localeCompare(b));
    res.json(lista);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /repairs/matrículas
app.get("/repairs/matr%C3%ADculas", listarMatriculas);

// GET /repairs/interv
app.get("/repairs/interv", async (req, res) => {
  try {
    const intervencoes = await Repair.aggregate([
      { $unwind: "$intervencoes" },
      {
        $group: {
          _id: {
            codigo: "$intervencoes.codigo",
            nome: "$intervencoes.nome",
            descricao: "$intervencoes.descricao",
          },
        },
      },
      { $sort: { "_id.codigo": 1 } },
      {
        $project: {
          _id: 0,
          codigo: "$_id.codigo",
          nome: "$_id.nome",
          descricao: "$_id.descricao",
        },
      },
    ]).exec();

    res.json(intervencoes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /repairs/:id
app.get("/repairs/:id", async (req, res) => {
  try {
    const repair = await Repair.findById(req.params.id).exec();
    if (!repair) return res.status(404).json({ error: "Nao encontrado" });
    res.json(repair);
  } catch (err) {
    res.status(400).json({ error: "ID invalido" });
  }
});

// POST /repairs
app.post("/repairs", async (req, res) => {
  try {
    const novo = new Repair(req.body);
    const guardado = await novo.save();
    res.status(201).json(guardado);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /repairs/:id
app.delete("/repairs/:id", async (req, res) => {
  try {
    const apagado = await Repair.findByIdAndDelete(req.params.id).exec();
    if (!apagado) return res.status(404).json({ error: "Nao encontrado" });
    res.json({ message: "Eliminado com sucesso", id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(16025, () =>
  console.log("API de dados em http://localhost:16025/repairs"),
);
