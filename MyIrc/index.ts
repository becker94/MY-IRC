const fs = require("fs")

import express from "express";
import http, { IncomingMessage } from "http";
import bodyParser from "body-parser";
import { db } from "./db";
import expressSession, { SessionData } from "express-session";
import { Server, Socket } from "socket.io";
import { RowDataPacket } from "mysql2";

declare module "express-session" {
  interface SessionData {
    user?: { id: number; username: string };
    canal?: { id: number; name: string };
  }
}
interface SessionIncomingMessage extends IncomingMessage {
  session: SessionData;
}
interface SessionSocket extends Socket {
  request: SessionIncomingMessage;
}
const session = expressSession({
  secret: "verysecret",
  resave: false,
  saveUninitialized: true,
  cookie: {},
});
const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer);

const wrapper = (middleware: any) => (socket: Socket, next: any) =>
  middleware(socket.request, {}, next);
io.use(wrapper(session));

const jsonParser = bodyParser.json();
const urlencodeParser = bodyParser.urlencoded({ extended: true });

app.use(jsonParser);
app.use(urlencodeParser);
app.use(session);

app.get("/", (request, response) => {
  if (request.session.user) {
    response.redirect("/connexion");
  } else {
    response.sendFile(__dirname + "/view/index.html");
  }
});
app.get("/check-user", (request, response) => {
  response.json({ user: request.session.user });
});
app.get("/connexion", (request, response) => {
  response.sendFile(__dirname + "/view/connexion.html");
});

app.get("/logout", (request, response) => {
  request.session.destroy((err) => {
    if (err) {
      console.log(err);
    }
    response.redirect("/");
  });
});

app.get("/channel", (request, response) => {
  response.sendFile(__dirname + "/view/channel.html");
});
app.post("/channel", (request, response) => {
  const newChannelName = request.body.canal;
  if (newChannelName) {
    const query = "INSERT INTO channels (name) VALUES (?)";
    db.query(query, newChannelName, (error, result) => {
      if (error) {
        console.log(error);
      } else {
        console.log("Nouveau canal créé avec succès !");
      }
    });
  }
  response.redirect("/channel");
});



app.get("/get-channels", (request, response) => {
  const query = "SELECT * FROM channels";
  db.query(query, (error, results) => {
    if (error) {
      console.log(error);
    } else {
      let channels: string[] = [];

      if (Array.isArray(results)) {
        channels = results.map((row) => row.name);
      }

      response.json(channels);
    }
  });
});
interface User {
  id: number;
  username: string;
  password: string;
}
app.get("/login", (request, response) => {

  response.sendFile(__dirname + "/view/login.html");
});

app.post("/login", (request, response) => {
  const username = request.body.username;
  const password = request.body.password;

  if (username && password) {
    const query = "SELECT * FROM users WHERE username = ? AND password = ?";
    db.query(query, [username, password], (error, result) => {
      if (error) {
        console.log(error);
        response.send("Erreur lors de la recherche de l'utilisateur");
      } else {
        if (Array.isArray(result) && result.length > 0) {
          const user = result[0] as User;
          request.session.user = {
            id: user.id,
            username: user.username,
          };
          console.log("Utilisateur connecté :", user.username);
          response.redirect("/connexion");
        } else {
          console.log("Identifiants incorrects");
          response.send("Identifiants incorrects");
        }
      }
    });
  } else {

    console.log("Nom d'utilisateur ou mot de passe manquant");
    response.send("Nom d'utilisateur ou mot de passe manquant");
  }
});






app.get("/register", (request, response) => {
  response.sendFile(__dirname + "/view/register.html");
});

app.post("/register", (request, response) => {
  const username = request.body.username;
  const password = request.body.password;
  if (username && password) {
    const query =
      "insert into users (username,password,role_id) VALUES (?,?,1)";
    db.query(query, [username, password], (error, result) => {
      if (error) {
        console.log(error);
        response.send("Erreur lors de la saisie, veuillez recommencer !");
      } else {
        console.log("user incrémenté avec succès !");
        const data = <RowDataPacket>result;
        response.redirect("/");
      }
    });
  } else {
    console.log("Username or password missing !");
    response.send("Username or password missing !");
  }
});

app.get("/chat", (request, response) => {
  if (request.session.user) {
    response.sendFile(__dirname + "/view/chat.html");
  } else {
    response.redirect("/");
  }
});


io.on('connection', async (defaultSocket) => {
  const socket = <SessionSocket>defaultSocket;
  const userSession = socket.request.session.user;

  if (userSession) {
    console.log(userSession?.username + ' is connected');

    socket.on('chat message', async (msg) => {
      const dateAjout = new Date().toLocaleTimeString();
      const messageToLog = `${dateAjout} - ${userSession.username}: ${msg}`;
      const query = "INSERT INTO messages (receiver_id, expeditor_id, content, channel_id) VALUES (?, ?, ?, ?)";
      const values = [userSession.id, userSession.id, msg, 1];

      try {
        await db.execute(query, values);
        console.log('Message enregistré dans la base de données.');
      } catch (error) {
        console.error('Erreur lors de l\'enregistrement du message dans la base de données:', error);
      }

      const fileName = 'logs/chat-log.txt';

      fs.appendFile(fileName, messageToLog + '\n', (err) => {
        if (err) {
          console.error('Erreur lors de l\'enregistrement du message dans le fichier.');
        }
      });

      io.emit('chat message', messageToLog);
    });
  }

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});





httpServer.listen(8080, () => console.log("hello world"));
