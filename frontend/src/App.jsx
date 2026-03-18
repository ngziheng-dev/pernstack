import { useState, useEffect } from "react"
import axios from "axios"
import { API_URL } from "./api.js"
import { MdModeEditOutline, MdOutlineDone } from "react-icons/md"
import { FaTrash } from "react-icons/fa6"
import { IoClose } from "react-icons/io5"

function App() {

  const [description, setDescription] = useState("");
  const [todos, setTodos] = useState([]);
  const [editingTodo, setEditingTodo] = useState(null);
  const [editedText, setEditedText] = useState("")
  const [loading, setLoading] = useState("")
  const [error, setError] = useState("")
  const [csvFile, setCsvFile] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [message, setMessage] = useState("");

  const getTodos = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await axios.get(`${API_URL}/todos`);
      setTodos(res.data)
      console.log(res.data)
    }
    catch (e) {
      console.error(e.message)
      setError("Failed to fetch todos. Please try again.")
    }
    finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    getTodos();
  }, []);

  const onSubmitForm = async (e) => {
    e.preventDefault();
    if (!description.trim()) return
    try {
      setError(null)
      const res = await axios.post(`${API_URL}/todos`, {
        description, completed: false
      });
      setTodos([...todos, res.data])
      setDescription("")
      getTodos();
    }
    catch (e) {
      console.error(e.message)
      setError("Failed to add. Please try again.")
    }
  }

  const saveEdit = async (id) => {
    try {
      setError(null)

      const currentTodo = todos.find((todo) => todo.todo_id === id)
      const trimmedText = editedText.trim()

      if (currentTodo.description === trimmedText) {
        setEditingTodo(null);
        setEditedText("");
        return
      }

      await axios.put(`${API_URL}/todos/${id}`, {
        description: editedText,
      });
      setEditingTodo(null);
      setEditedText("");
      setTodos(todos.map((todo) => todo.todo_id === id ? { ...todo, description: editedText, completed: false } : todo))
    }
    catch (e) {
      console.error(e.message)
      setError("Failed to update. Please try again.")
    }
  }

  const deleteTodo = async (id) => {
    try {
      setError(null)
      await axios.delete(`${API_URL}/todos/${id}`);
      setTodos(todos.filter((todo) => todo.todo_id !== id))
      getTodos();
    }
    catch (e) {
      console.error(e.message)
      setError("Failed to delete. Please try again.")
    }
  }

  const toggleCompleted = async (id) => {
    try {
      const todo = todos.find((todo) => todo.todo_id === id)
      await axios.put(`${API_URL}/todos/${id}`, {
        description: todo.description,
        completed: !todo.completed
      });
      setTodos(todos.map((todo) => todo.todo_id === id ? { ...todo, completed: !todo.completed } : todo))
    }
    catch (e) {
      console.error(e.message)
    }
  }

  const testNetSuiteAPI = async () => {

    try {

      const res = await axios.get(`${API_URL}/todos/netsuite-test`);

      console.log(res.data);
      alert("NetSuite API call success");

    }
    catch (e) {

      console.error(e);
      alert("NetSuite API failed");

    }

  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setProgress(0);
    setMessage("");
    setStartTime(null);
    setEndTime(null);
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage("Please select a CSV file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    setStartTime(new Date());
    setMessage("");

    try {
      const res = await axios.post(
        `${API_URL}/todos/upload`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (progressEvent) => {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setProgress(percent);
          },
        }
      );

      setEndTime(new Date());
      setMessage(res.data.message || "Upload completed successfully!");
    } catch (err) {
      console.error(err);
      setEndTime(new Date());
      setMessage(
        err.response?.data?.error || "Upload failed. Check server logs."
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <div className="max-w-lg mx-auto p-6 bg-gray-50 rounded shadow-md mt-6">
        <h2 className="text-2xl font-bold mb-4">Upload Daily CSV</h2>

        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="mb-4"
        />

        <button
          onClick={handleUpload}
          disabled={uploading}
          className={`px-4 py-2 rounded text-white ${
            uploading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {uploading ? "Uploading..." : "Upload CSV"}
        </button>

        {uploading && (
          <div className="mt-4 w-full bg-gray-200 rounded h-4">
            <div
              className="bg-green-500 h-4 rounded"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        )}

        {startTime && (
          <p className="mt-2 text-sm text-gray-700">
            Start Time: {startTime.toLocaleTimeString()}
          </p>
        )}
        {endTime && (
          <p className="text-sm text-gray-700">
            End Time: {endTime.toLocaleTimeString()}
          </p>
        )}

        {message && (
          <p className="mt-2 text-sm font-medium text-gray-800">{message}</p>
        )}
      </div>
    </>
  )
}

export default App
