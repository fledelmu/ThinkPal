import { useState, useEffect } from 'react';
import delete_icon from "../assets/icons/delete_icon.png";
import edit_icon from "../assets/icons/edit_icon.png";
import add_icon from "../assets/icons/add_task.png";
import { getTasks, addTask, editTask, deleteTask } from "../utils/api";

const NewTask = ({ onClose, onTaskAdded }) => {
  const [taskName, setTaskName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Pending");

  const handleAddTask = async () => {
    if (!taskName.trim() || !description.trim()) {
      alert("Please fill out all fields!");
      return;
    }

    try {
      await addTask(taskName, description, status);
      onTaskAdded(); // Refresh the list after adding
      onClose(); // Close modal
    } catch (error) {
      console.error("Error adding task:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="flex flex-col text-left bg-rule-bg w-[30%] p-6 rounded-2xl shadow-xl text-rule-text">
        <h1 className="text-2xl font-bold mb-4">Add New Task</h1>

        <h1 className="font-bold">Task Name:</h1>
        <input
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
          className="w-[70%] h-10 border border-gray-400 rounded-md mb-4 px-2"
          placeholder="Enter task name..."
        />

        <h1 className="font-bold">Description:</h1>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-[70%] h-32 border border-gray-400 rounded-md px-2 py-1 resize-none"
          placeholder="Enter task description..."
        ></textarea>

        <h1 className="font-bold mt-4">Status:</h1>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-[70%] h-10 border border-gray-400 rounded-md mb-4 px-2"
        >
          <option value="Pending">Pending</option>
          <option value="Completed">Completed</option>
        </select>

        <div className="flex justify-end mt-6 gap-3">
          <button
            onClick={onClose}
            className="bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded-lg font-bold"
          >
            Close
          </button>
          <button
            onClick={handleAddTask}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-bold"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

const DisplayTask = ({
  task,
  onDelete,
  onEdit,
  isEditing,
  editedData,
  onSave,
  onCancel,
  setEditedData
}) => {
  return (
    <div className="flex flex-row justify-start gap-8 m-2 border border-gray-400 p-5 rounded-xl text-rule-text font-bold">
      {/* Task Name */}
      <div className="m-0 w-[20%] min-w-0 flex items-center">
        {isEditing ? (
          <input
            value={editedData.task_name || task.task_name}
            onChange={(e) =>
              setEditedData((prev) => ({ ...prev, task_name: e.target.value }))
            }
            className="w-full border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent text-xl"
            placeholder="Edit task name..."
          />
        ) : (
          <span className="text-xl">{task.task_name}</span>
        )}
      </div>

      {/* Task Details */}
      <div className="m-0 w-[40%] min-w-0 flex items-center">
        {isEditing ? (
          <input
            value={editedData.task_details || task.task_details}
            onChange={(e) =>
              setEditedData((prev) => ({ ...prev, task_details: e.target.value }))
            }
            className="w-full border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent text-xl"
            placeholder="Edit details..."
          />
        ) : (
          <span className="text-xl">{task.task_details}</span>
        )}
      </div>

      {/* Task Status */}
      <div className="m-0 w-1/5 min-w-0 text-right flex items-center">
        {isEditing ? (
          <select
            value={editedData.status || task.status}
            onChange={(e) =>
              setEditedData((prev) => ({ ...prev, status: e.target.value }))
            }
            className="flex-1 border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent text-xl text-right"
          >
            <option value="Pending">Pending</option>
            <option value="Completed">Completed</option>
          </select>
        ) : (
          <span className="text-xl">{task.status}</span>
        )}
      </div>

      {/* Action Buttons */}
      <div className="m-0 w-[20%] flex items-center gap-1 justify-end px-5">
        {!isEditing ? (
          <>
            <button
              onClick={() => onEdit(task)}
              className="p-2 hover:text-blue-700 transition-all w-10 h-10"
              title="Edit Task"
            >
              <img src={edit_icon} alt="Edit" className="w-8 h-8" />
            </button>
            <button
              onClick={() => onDelete(task.task_id)}
              className="p-2 hover:text-red-700 transition-all w-10 h-10"
              title="Delete Task"
            >
              <img src={delete_icon} alt="Delete" className="w-8 h-8" />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={onSave}
              className="p-2 text-green-500 hover:text-green-700 transition-all w-10 h-10"
              title="Save Changes"
            >
              <img src={edit_icon} alt="Save" className="w-8 h-8" />
            </button>
            <button
              onClick={onCancel}
              className="p-2 text-gray-500 hover:text-gray-700 transition-all w-10 h-10"
              title="Cancel"
            >
              <img src={delete_icon} alt="Cancel" className="w-8 h-8" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

const Tasks = () => {
  const [taskList, setTaskList] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editedData, setEditedData] = useState({});
  const [showNewTask, setShowNewTask] = useState(false); // 🟢 controls modal visibility

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const data = await getTasks();
        setTaskList(data);
      } catch (err) {
        console.error("Failed to load tasks:", err);
      }
    };
    fetchTasks();
  }, []);

  // Delete
  const handleDelete = async (id) => {
    if (confirm("Delete this task?")) {
      try {
        await deleteTask(id);
        setTaskList((prev) => prev.filter((task) => task.task_id !== id));
      } catch (err) {
        console.error("Error deleting task:", err);
      }
    }
  };

  // Edit
  const handleEdit = (task) => {
    setEditingId(task.task_id);
    setEditedData({
      task_name: task.task_name,
      task_details: task.task_details,
      status: task.status,
    });
  };

  // Save
  const handleSave = async (id) => {
    try {
      const updated = await editTask(
        id,
        editedData.task_name,
        editedData.task_details,
        editedData.status
      );
      setTaskList((prev) =>
        prev.map((task) => (task.task_id === id ? updated : task))
      );
      setEditingId(null);
      setEditedData({});
    } catch (err) {
      console.error("Error updating task:", err);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditedData({});
  };

  return (
    <>
      <div className="grid grid-rows-[60px_auto_auto_auto_1fr] gap-2 w-[80vw] h-[95vh] mt-14 ml-32 text-left">
        <h1 className="text-4xl font-bold text-rule-text">Tasks</h1>

        <div className="flex items-start text-3xl font-bold text-rule-text gap-4">
          <button>Pending</button>
          <h1>|</h1>
          <button>Completed</button>
        </div>

        <div className="flex flex-row">
          <button
            onClick={() => setShowNewTask(true)} // 🟢 open modal
            className="p-2 text-green-500 hover:text-green-700 transition-all flex items-center"
            title="Add Task"
          >
            <img src={add_icon} alt="Add Task" className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-col w-full mt-0 text-rule-text gap-0">
          <div className="flex flex-row justify-start text-3xl font-bold leading-none m-2 gap-8 pb-0">
            <h1 className="m-0 w-[20%]">Task Name</h1>
            <h1 className="m-0 w-[40%]">Details</h1>
            <h1 className="m-0 w-[43%]">Status</h1>
          </div>
          <div className="h-[2px] bg-gray-400 w-full mt-0"></div>
        </div>

        <div className="overflow-y-auto h-full overflow-x-auto">
          {taskList.map((task) => (
            <DisplayTask
              key={task.task_id}
              task={task}
              onDelete={handleDelete}
              onEdit={handleEdit}
              isEditing={editingId === task.task_id}
              editedData={editedData}
              onSave={() => handleSave(task.task_id)}
              onCancel={handleCancel}
              setEditedData={setEditedData}
            />
          ))}
        </div>
      </div>

      {showNewTask && (
        <NewTask
          onClose={() => setShowNewTask(false)}
          onTaskAdded={fetchTasks}  
        />
      )}
    </>
  );
};

export default Tasks;
