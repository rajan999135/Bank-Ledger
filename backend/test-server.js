const express = require("express");

const app = express();

app.get("/test", (req, res) => {
    console.log("Test request reached");

    res.json({
        message: "Server is working"
    });
});

app.listen(3001, () => {
    console.log("Temporary server running on port 3001");
});