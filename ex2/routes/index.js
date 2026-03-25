var express = require("express");
var axios = require("axios");

var router = express.Router();

const API_URL = process.env.API_URL || "http://localhost:16025/repairs";

router.get("/", function (req, res) {
  var d = new Date().toISOString().substring(0, 16);

  axios
    .get(API_URL)
    .then(function (resp) {
      var repairs = resp.data;
      var marcas = repairs
        .map(function (r) {
          return r.viatura && r.viatura.marca ? r.viatura.marca : null;
        })
        .filter(Boolean);

      var marcasDistintas = Array.from(new Set(marcas)).sort(function (a, b) {
        return a.localeCompare(b);
      });

      res.render("index", {
        title: "Reparacoes da Oficina",
        repairs: repairs,
        meta: {
          totalRegistos: repairs.length,
          totalMarcas: marcasDistintas.length,
        },
        date: d,
      });
    })
    .catch(function (err) {
      next(err);
    });
});

router.get("/:id([0-9a-fA-F]{24})", function (req, res, next) {
  var d = new Date().toISOString().substring(0, 16);
  axios
    .get(API_URL + "/" + req.params.id)
    .then(function (resp) {
      res.render("repair", {
        title: "Registo de Reparacao",
        repair: resp.data,
        date: d,
      });
    })
    .catch(function (err) {
      next(err);
    });
});

router.get("/:marca", function (req, res, next) {
  var d = new Date().toISOString().substring(0, 16);
  var marca = decodeURIComponent(req.params.marca);

  axios
    .get(API_URL, { params: { marca: marca } })
    .then(function (resp) {
      var repairs = resp.data;
      var modelos = repairs
        .map(function (r) {
          return r.viatura && r.viatura.modelo ? r.viatura.modelo : null;
        })
        .filter(Boolean);

      var modelosDistintos = Array.from(new Set(modelos)).sort(function (a, b) {
        return a.localeCompare(b);
      });

      res.render("brand", {
        title: "Pagina da Marca",
        marca: marca,
        modelos: modelosDistintos,
        repairs: repairs,
        date: d,
      });
    })
    .catch(function (err) {
      next(err);
    });
});

module.exports = router;
