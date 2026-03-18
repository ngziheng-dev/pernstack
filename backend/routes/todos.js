import { Router } from "express";
import pool from "../db.js";
import { getRequest } from "../netsuite.js";
import multer from "multer";
import csvParser from "csv-parser";
import fs from "fs";
import pkg from "pg-copy-streams";
const { from: copyFrom } = pkg;

const upload = multer({ dest: "uploads/" });
const router = Router();

router.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "CSV file required" });

  try {
    // 1️⃣ Get NetSuite data
    const response = await getRequest();
    const locationResult = response.data.locations;
    const itemResult = response.data.items;

    // 2️⃣ Convert arrays to maps for fast lookup
    const locationMap = new Map();
    locationResult.forEach(loc => {
      const [id, name, code] = loc.values;
      locationMap.set(code, { locId: id, locName: name });
    });

    const itemMap = new Map();
    itemResult.forEach(it => {
      const [id, name, code] = it.values;
      itemMap.set(code, { itemId: id, itemName: name });
    });

    // 3️⃣ Open PostgreSQL client and COPY stream
    const client = await pool.connect();
    const fileStream = fs.createReadStream(req.file.path);
    const copyStream = client.query(copyFrom(`
      COPY stock_report (
        outlet, ns_outlet_name, ns_outlet_id, date, item_code, ns_item_id, ns_item_name, soh_qty, rl28_sales_qty, ads
      )
      FROM STDIN WITH CSV
    `));

    fileStream
      .pipe(csvParser())
      .on("data", row => {
        const outletCode = row["Outlet"];
        const itemCode = row["Item Code"];

        const loc = locationMap.get(outletCode) || { locId: '', locName: '' };
        const it = itemMap.get(itemCode) || { itemId: '', itemName: '' };

        // Create CSV row for COPY
        const csvRow = [
          outletCode,
          loc.locName,
          loc.locId,
          row["Date"],
          itemCode,
          it.itemId,
          it.itemName,
          row["SOH Qty"],
          row["RL28 Sales Qty"],
          row["ADS"]
        ].map(v => (v === null || v === undefined ? '' : v)).join(",") + "\n";

        copyStream.write(csvRow);
      })
      .on("end", () => {
        copyStream.end();
      })
      .on("error", err => {
        console.error("CSV parse error", err);
        res.status(500).json({ error: "Failed to parse CSV" });
      });

    copyStream.on("finish", () => {
      client.release();
      fs.unlinkSync(req.file.path); // remove temp CSV
      res.json({ message: "CSV uploaded and inserted successfully" });
    });

    copyStream.on("error", err => {
      console.error("COPY error", err);
      client.release();
      res.status(500).json({ error: "COPY failed" });
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/netsuite-test", async (req, res) => {

  console.log("Enter todos netsuite-test");

  try {

    const response = await getRequest();

    res.json(response.data);

  }
  catch (e) {

    console.error("NetSuite API Error:");
    console.error(e);
    console.error(e.response?.data);
    res.status(500).send("Failed to call NetSuite API");

  }

});

router.post("/", async (req, res) => {

    try {

        const { description, completed } = req.body;
        if (!description) {
            return res.status(400).json({ error: "Description is required" })
        }
        const newTodo = await pool.query(
            "INSERT INTO todo (description, completed) VALUES ($1, $2) RETURNING *",
            [description, completed || false]
        );
        res.json(newTodo.rows[0]);

    }

    catch (e) {

        console.error(e.message);
        res.status(500).send("Server Error")

    }

})

router.get("/", async (req, res) => {

    try {

        const allTodos = await pool.query("SELECT * FROM todo LIMIT 50 OFFSET 0;");
        res.json(allTodos.rows);

    }

    catch (e) {

        console.error(e.message);
        res.status(500).send("Server Error")

    }

})

router.put("/:id", async (req, res) => {

    try {

        const { id } = req.params;
        const { description, completed } = req.body;
        if (!description) {
            return res.status(400).json({ error: "Description is required" })
        }
        const updateTodo = await pool.query(
            "UPDATE todo SET description = $1, completed = $2 WHERE todo_id = $3 RETURNING *",
            [description, completed || false, id]
        );
        if (updateTodo.rows.length === 0) {
            return res.status(400).json({ error: "Todo not found" })
        }
        
        res.json({
            message: "Todo was updated",
            todo: updateTodo.rows[0]
        });

    }

    catch (e) {

        console.error(e.message);
        res.status(500).send("Server Error")

    }

})

router.delete("/:id", async (req, res) => {

    try {

        const { id } = req.params;
        const deleteTodo = await pool.query("DELETE FROM todo WHERE todo_id = $1 RETURNING *", [id]);
        if (deleteTodo.rows.length === 0) {
            return res.status(400).json({ error: "Todo not found" })
        }
        
        res.json("Todo was deleted!");

    }

    catch (e) {

        console.error(e.message);
        res.status(500).send("Server Error")

    }

})

export default router