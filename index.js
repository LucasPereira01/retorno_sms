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

  let resposta = req.body[0];

  let status = resposta.eyou.statusDesc;
  console.log("Retorno recebido");
  console.log(JSON.stringify(resposta, null, 2));

  async function PostEventCI360() {
    console.log("Iniciando e Envio do Evento");

    const bodyCi360 = {
      eventName: status,
      datahub_id: resposta.attributes.datahub_id,
      task_id: resposta.attributes.task_id,
      destination: resposta.destination,
      campainId: resposta.campainId,
    };
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
        console.log("Mensagem enviada com sucesso!");
        res.send(
          `Status do envio: ${response.status}-${JSON.stringify(
            response.data,
            null,
            2
          )}`
        );
      }
    } catch (error) {
      if (
        error.response &&
        error.response.data &&
        error.response.data.userMessage
      ) {
        const errorMessage = error.response.data.userMessage;
        res.status(400).send(`Erro na solicitação: ${errorMessage}`);
      } else {
        res.status(400).send("Erro na solicitação");
      }
    }
  }
  PostEventCI360();
});
