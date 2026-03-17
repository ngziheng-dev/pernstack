import { Router } from "express";
import pool from "../db.js";
import { getRequest } from "../netsuite.js";

const router = Router();

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