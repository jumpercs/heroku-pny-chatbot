const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const { WebhookClient } = require('dialogflow-fulfillment');
const dialogflow = require('@google-cloud/dialogflow');
const sessionClient = new dialogflow.SessionsClient({ keyFilename: 'persianasny-w-api-wcoj-294ef33e72ab.json' });
const express = require('express');
const { body, validationResult } = require('express-validator');
const socketIO = require('socket.io');
const qrcode = require('qrcode');
const http = require('http');
const fileUpload = require('express-fileupload');
const axios = require('axios');
const mime = require('mime-types');
const port = process.env.PORT || '8000';
const app = express();
app.set('port', port);
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.json());
app.use(express.urlencoded({
extended: true
}));
app.use(fileUpload({
debug: true
}));
app.use("/", express.static(__dirname + "/"))

app.get('/', (req, res) => {
  res.sendFile('index.html', {
    root: __dirname
  });
});

const client = new Client({
  authStrategy: new LocalAuth({ clientId: 'bot' }),
  puppeteer: { headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process', // <- this one doesn't works in Windows
      '--disable-gpu'
    ] }
});

client.initialize();

io.on('connection', function(socket) {
  socket.emit('message', 'Iniciado');
  socket.emit('qr', './icon.svg');

client.on('qr', (qr) => {
    console.log('QR RECEIVED', qr);
    qrcode.toDataURL(qr, (err, url) => {
      socket.emit('qr', url);
      socket.emit('message', 'QRCode recebido, aponte a câmera  seu celular!');
    });
});

client.on('ready', () => {
    socket.emit('ready', 'Dispositivo pronto!');
    socket.emit('message', 'Dispositivo pronto!');
    socket.emit('qr', './check.svg')	
    console.log('Dispositivo pronto');
});

client.on('authenticated', () => {
    socket.emit('authenticated', 'Autenticado!');
    socket.emit('message', 'Autenticado!');
    console.log('Autenticado');
});

client.on('auth_failure', function() {
    socket.emit('message', 'Falha na autenticação, reiniciando...');
    console.error('Falha na autenticação');
});

client.on('change_state', state => {
  console.log('Status de conexão: ', state );
});

client.on('disconnected', (reason) => {
  socket.emit('message', 'Cliente desconectado!');
  console.log('Cliente desconectado', reason);
  client.initialize();
});
});

// Send message
app.post('/message', [
  body('number').notEmpty(),
  body('message').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req).formatWith(({
    msg
  }) => {
    return msg;
  });

  if (!errors.isEmpty()) {
    return res.status(422).json({
      status: false,
      message: errors.mapped()
    });
  }

  const number = req.body.number;
  const numberDDI = number.substr(0, 2);
  const numberDDD = number.substr(2, 2);
  const numberUser = number.substr(-8, 8);
  const message = req.body.message;

  if (numberDDI !== "55") {
    const number = number + "@c.us";
    client.sendMessage(number, message).then(response => {
    res.status(200).json({
      status: true,
      message: 'Mensagem enviada',
      response: response
    });
    }).catch(err => {
    res.status(500).json({
      status: false,
      message: 'Mensagem não enviada',
      response: err.text
    });
    });
  }
  else if (numberDDI === "55" && parseInt(numberDDD) <= 30) {
    const number = "55" + numberDDD + "9" + numberUser + "@c.us";
    client.sendMessage(number, message).then(response => {
    res.status(200).json({
      status: true,
      message: 'Mensagem enviada',
      response: response
    });
    }).catch(err => {
    res.status(500).json({
      status: false,
      message: 'Mensagem não enviada',
      response: err.text
    });
    });
  }
  else if (numberDDI === "55" && parseInt(numberDDD) > 30) {
    const number = "55" + numberDDD + numberUser + "@c.us";
    client.sendMessage(number, message).then(response => {
    res.status(200).json({
      status: true,
      message: 'Mensagem enviada',
      response: response
    });
    }).catch(err => {
    res.status(500).json({
      status: false,
      message: 'Mensagem não enviada',
      response: err.text
    });
    });
  }
});


// Send media
app.post('/media', [
  body('number').notEmpty(),
  body('caption').notEmpty(),
  body('file').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req).formatWith(({
    msg
  }) => {
    return msg;
  });

  if (!errors.isEmpty()) {
    return res.status(422).json({
      status: false,
      message: errors.mapped()
    });
  }

  const number = req.body.number;
  const numberDDI = number.substr(0, 2);
  const numberDDD = number.substr(2, 2);
  const numberUser = number.substr(-8, 8);
  const caption = req.body.caption;
  const fileUrl = req.body.file;

  let mimetype;
  const attachment = await axios.get(fileUrl, {
    responseType: 'arraybuffer'
  }).then(response => {
    mimetype = response.headers['content-type'];
    return response.data.toString('base64');
  });

  const media = new MessageMedia(mimetype, attachment, 'Media');

  if (numberDDI !== "55") {
    const number = number + "@c.us";
    client.sendMessage(number, media, {caption: caption}).then(response => {
    res.status(200).json({
      status: true,
      message: 'Imagem enviada',
      response: response
    });
    }).catch(err => {
    res.status(500).json({
      status: false,
      message: 'Imagem não enviada',
      response: err.text
    });
    });
  }
  else if (numberDDI === "55" && parseInt(numberDDD) <= 30) {
    const number = "55" + numberDDD + "9" + numberUser + "@c.us";
    client.sendMessage(number, media, {caption: caption}).then(response => {
    res.status(200).json({
      status: true,
      message: 'Imagem enviada',
      response: response
    });
    }).catch(err => {
    res.status(500).json({
      status: false,
      message: 'Imagem não enviada',
      response: err.text
    });
    });
  }
  else if (numberDDI === "55" && parseInt(numberDDD) > 30) {
    const number = "55" + numberDDD + numberUser + "@c.us";
    client.sendMessage(number, media, {caption: caption}).then(response => {
    res.status(200).json({
      status: true,
      message: 'Imagem enviada',
      response: response
    });
    }).catch(err => {
    res.status(500).json({
      status: false,
      message: 'Imagem não enviada',
      response: err.text
    });
    });
  }
});

client.on('message', async (msg) => {
  try {
      console.log('Mensagem recebida', msg);
      let textoResposta = await executeQueries('persianasny-w-api-wcoj', msg.from, [msg.body], 'pt-br');
      let textoFormatado;

      try {
          textoFormatado = textoResposta.replace(/\\n/g, '\n');

      } catch (error) {

      }

      msg.reply(textoFormatado);
  } catch (error) {
      console.log(error);
  }
});

    
server.listen(port, function() {
        console.log('App running on *: ' + port);
});



function isBlank(str) {
  return (!str || /^\s*$/.test(str));
}
async function detectIntent(
  projectId,
  sessionId,
  query,
  contexts,
  languageCode
) {

  try {
      const sessionPath = sessionClient.projectAgentSessionPath(
          projectId,
          sessionId
      );

      // The text query request.
      const request = {
          session: sessionPath,
          queryInput: {
              text: {
                  text: query,
                  languageCode: languageCode,
              },
          },
      };

      if (contexts && contexts.length > 0) {
          request.queryParams = {
              contexts: contexts,
          };
      }

      const responses = await sessionClient.detectIntent(request);
      return responses[0];
  } catch (error) {
      console.log(error);
  }


}
async function executeQueries(projectId, sessionId, queries, languageCode) {
  let context;
  let intentResponse;
  for (const query of queries) {
      try {
          console.log(`Pergunta: ${query}`);
          intentResponse = await detectIntent(
              projectId,
              sessionId,
              query,
              context,
              languageCode
          );
          //console.log('Enviando Resposta');
          if (isBlank(intentResponse.queryResult.fulfillmentText)) {
              console.log('Sem resposta definida no DialogFlow');
              return "null";
          }
          else {
              console.log('Resposta definida no DialogFlow');
              //console.log(intentResponse.queryResult.fulfillmentText);
              return `${intentResponse.queryResult.fulfillmentText}`
          }
      } catch (error) {
          console.log(error);
      }
  }
}


function intervalFunc() {
  console.log('Cant stop me now!');
}

setInterval(intervalFunc, 5000);

