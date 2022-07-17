const amqp = require("amqplib/callback_api");

var amqpConn = null;
var pubChannel = null;
const EXCHANGE = "support_service";
const ROUTING_KEY = "add_comment";

const USER = "freshshop";
const PASS = "udpt17";
const HOST = "localhost";
const PORT = "5672";

exports.start = start;
exports.publishItemToCart = publishItemToCart;

function start() {
  amqp.connect(
    `amqp://${USER}:${PASS}@${HOST}:${PORT}/` + "?heartbeat=60",
    function (err, conn) {
      if (err) {
        console.error("[AMQP]", err.message);
        return setTimeout(start, 100);
      }

      conn.on("error", function (err) {
        if (err !== "Connection closing") {
          console.error("[AMQP] error", err.message);
        }
      });

      conn.on("close", function () {
        console.error("[AMQP] reconnecting");
        return setTimeout(start, 100);
      });

      console.log("[AMQP] connected");
      amqpConn = conn;

      whenConnecting();
    }
  );
}

function whenConnecting() {
  startPublishChannel();
}

function publishItemToCart(goods, quantity, accountId) {
  var content = { goods: goods, quantity: quantity, userId: accountId };
  var message = Buffer.from(JSON.stringify(content));

  const flag = pubChannel.publish(
    EXCHANGE,
    ROUTING_KEY,
    message,
    function (err, ok) {
      if (err) {
        console.error("[AMQP] publish", e.message);
        pubChannel.connection.close();
      }
    }
  );

  return flag;
}

function startPublishChannel() {
  amqpConn.createConfirmChannel(function (err, channel) {
    if (closeOnError(err)) return;

    channel.on("error", function (err) {
      console.log("[AMQP] channel error", err.message);
    });

    channel.on("close", function () {
      console.log("[AMQP] channel closed");
    });

    pubChannel = channel;
    console.log("[AMQP] channel started");
  });
}

function closeOnError(err) {
  if (!err) return false;

  console.log("[AMQP] error", err);
  amqpConn.close();
  return true;
}
