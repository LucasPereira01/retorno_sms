const { default: axios } = require("axios");
const bodyParser = require("body-parser");
const express = require("express");
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

require("dotenv").config("/.env");

app.listen(process.env.SERVER_PORT, () => {
  console.log(`Esperando resposta do SMS na porta ${process.env.SERVER_PORT}`);
});

app.post(process.env.ENDPOINT_NAME, async (req, res) => {
  const tokenCi360 = `Bearer ${process.env.TOKENCI}`;
  const ulrCi360 = process.env.URLCI;

  const dataArray = req.body;

  function createCi360RequestBody(resposta) {
    const status = resposta.eyou.statusDesc;
    const statusCode = resposta.eyou.status;
    if (statusCode == "2" || statusCode == "6") {
      return {
        eventName: status,
        datahub_id: resposta.attributes.datahub_id,
        task_id: resposta.attributes.task_id,
        destination: resposta.destination,
        costCenter: resposta.costCenter,
        campainId: resposta.campainId,
        moText: resposta.eyou.moText,
      };
    }
    return null;
  }

  async function sendRequests() {
    const batchSize = 100;
    for (let i = 0; i < dataArray.length; i += batchSize) {
      const batch = dataArray.slice(i, i + batchSize);

      const requests = batch.map(async (resposta) => {
        const bodyCi360 = createCi360RequestBody(resposta);
        if (bodyCi360) {
          const status = resposta.eyou.statusDesc; // Armazena o status aqui
          console.log("Retorno recebido");
          console.log(JSON.stringify(resposta, null, 2));
          console.log("Body Alterado");
          console.log(bodyCi360);

          const headers = {
            Authorization: tokenCi360,
            "Content-Type": "application/json",
          };
          try {
            const response = await axios.post(ulrCi360, bodyCi360, {
              headers: headers,
            });

            if (response.status === 200 || response.status === 201) {
              console.log("Evento enviado com sucesso!");
            }
          } catch (error) {
            console.error("Erro na solicitação:", error.message);
          }
        } else {
          console.log(`Retornos descartados ${resposta.eyou.statusDesc}`);
        }
      });

      await Promise.all(requests);
    }
  }

  sendRequests();

  res.status(200).send({ success: "Eventos enviados com sucesso!" });
});
