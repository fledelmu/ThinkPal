import { useState } from 'react';
import delete_icon from "../assets/icons/delete_icon.png";
import edit_icon from "../assets/icons/edit_icon.png";
import add_icon from "../assets/icons/add_task.png";

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
        <>
            <div className="flex flex-row justify-start gap-8 m-2 border border-gray-400 p-5 rounded-xl text-rule-text font-bold">
                {/* Subject Column - Adjusted to 20% */}
                <div className="m-0 w-[20%] min-w-0 flex items-center"> 
                    {isEditing ? (
                        <input
                            value={editedData.subject || task.subject}
                            onChange={(e) => setEditedData(prev => ({ ...prev, subject: e.target.value }))}
                            className="w-full border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent text-xl"
                            placeholder="Edit subject..."
                        />
                    ) : (
                        <span className="text-xl">{task.subject}</span>
                    )}
                </div>

                {/* Description Column - Adjusted to 40% */}
                <div className="m-0 w-[40%] min-w-0 flex items-center"> 
                    {isEditing ? (
                        <input
                            value={editedData.description || task.description}
                            onChange={(e) => setEditedData(prev => ({ ...prev, description: e.target.value }))}
                            className="w-full border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent text-xl"
                            placeholder="Edit description..."
                        />
                    ) : (
                        <span className="text-xl">{task.description}</span>
                    )}
                </div>
 
                {/* Status Column - Now toggleable in edit mode */}
                <div className="m-0 w-1/5 min-w-0 text-right flex items-center">
                    {isEditing ? (
                        <select
                            value={editedData.status || task.status}
                            onChange={(e) => setEditedData(prev => ({ ...prev, status: e.target.value }))}
                            className="flex-1 border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent text-xl text-right"
                        >
                            <option value="Pending">Pending</option>
                            <option value="Completed">Completed</option>
                        </select>
                    ) : (
                        <span className="text-xl">{task.status}</span>
                    )}
                </div>
                
                {/* Actions Column - 20% with consistent button/icon sizing */}
                <div className="m-0 w-[20%] h-full min-w-0 flex items-center gap-1 justify-end px-5"> 
                    {!isEditing ? (
                        <>
                            {/* Edit Button */}
                            <button
                                onClick={() => onEdit(task)}
                                className="p-2 text-blue-500 hover:text-blue-700 transition-all w-10 h-10"
                                title="Edit Task"
                            >
                                <img src={edit_icon} alt="Edit" className="w-8 h-8" />
                            </button>
                            {/* Delete Button */}
                            <button
                                onClick={() => onDelete(task.id)}
                                className="p-2 text-red-500 hover:text-red-700 transition-all w-10 h-10"
                                title="Delete Task"
                            >
                                <img src={delete_icon} alt="Delete" className="w-8 h-8" />
                            </button>
                        </>
                    ) : (
                        <>
                            {/* Save Button */}
                            <button
                                onClick={onSave}
                                className="p-2 text-green-500 hover:text-green-700 transition-all w-10 h-10"
                                title="Save Changes"
                            >
                                <img src={edit_icon} alt="Save" className="w-8 h-8" />
                            </button>
                            {/* Cancel Button */}
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
        </>
    );
};

const Tasks = () => {
    const [taskList, setTaskList] = useState([
        { id: 1, subject: "Math Homework", description: "Chapter 5 exercises", status: "Pending" },
        { id: 2, subject: "Science Project", description: "Volcano model", status: "Completed" },
        { id: 3, subject: "History Essay", description: "WWII summary", status: "Pending" },
    ]);

    const [editingId, setEditingId] = useState(null); // Tracks the editing task ID
    const [editedData, setEditedData] = useState({}); // Temporary edits

    const handleDelete = (id) => {
        if (confirm('Delete this task?')) {
            setTaskList(prev => prev.filter(task => task.id !== id));
            // Auto-cancel if deleting the editing task
            if (editingId === id) {
                setEditingId(null);
                setEditedData({});
            }
        }
    };

    // Start editing: Set ID and pre-fill data (now includes status)
    const handleEdit = (task) => {
        setEditingId(task.id);
        setEditedData({ 
            subject: task.subject, 
            description: task.description, 
            status: task.status 
        });
    };

    // Save: Update taskList with edited data (including status)
    const handleSave = (id) => {
        setTaskList(prev => 
            prev.map(task => 
                task.id === id ? { ...task, ...editedData } : task
            )
        );
        setEditingId(null);
        setEditedData({});
    };

    // Cancel: Reset editing state
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
                            className="p-2 text-green-500 hover:text-green-700 transition-all flex items-center"
                            title="Add Task"
                            // onClick={handleAddTask} // Add handler later for modal/form
                        >
                            <img src={add_icon} alt="Add Task" className="w-6 h-6" /> 
                        </button>
                </div>
                <div className="flex flex-col w-full mt-0 text-rule-text gap-0"> 
                    {/* Header Row - Matched widths + Actions column */}
                    <div className="flex flex-row justify-start text-3xl text-left font-bold leading-none m-2 gap-8 pb-0">
                        <h1 className="m-0 w-[20%]">Subject</h1> 
                        <h1 className="m-0 w-[40%]">Description</h1> 
                        <h1 className="m-0 w-[43%]">Status</h1> {/* Matched to 20% */}
                    </div>
                    <div className="h-[2px] bg-gray-400 w-full mt-0"></div> 
                </div>
                <div className="overflow-y-auto h-full overflow-x-auto"> 
                    
                    {taskList.map(task => (
                        <DisplayTask 
                            key={task.id} 
                            task={task} 
                            onDelete={handleDelete}
                            onEdit={handleEdit}
                            isEditing={editingId === task.id}
                            editedData={editedData}
                            onSave={() => handleSave(task.id)}
                            onCancel={handleCancel}
                            setEditedData={setEditedData}
                        />
                    ))}
                </div>
            </div>
        </>
    );
};
export default Tasks;
