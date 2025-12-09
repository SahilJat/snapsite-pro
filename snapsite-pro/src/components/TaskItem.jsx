// client/src/components/TaskItem.jsx
import { useState } from 'react';

// We receive "props" from the parent (App.jsx)
// onUpdate and onDelete are functions passed down from App
function TaskItem({ task, onUpdate, onDelete }) {

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(task.text);

  // Handle clicking the "Save" button
  const handleSave = () => {
    // Call the parent's update function with new text
    onUpdate(task.id, { text: editText });
    setIsEditing(false); // Switch back to View Mode
  };

  return (
    <div className={`flex justify-between items-center p-4 rounded-lg border transition-all ${task.priority === "High" ? "bg-red-900/20 border-red-500/50" : "bg-gray-700 border-gray-600"
      }`}>

      {/* LEFT SIDE: Content */}
      <div className="flex items-center gap-3 flex-1">

        {/* Priority Badge (Click to toggle) */}
        <button
          onClick={() => onUpdate(task.id, {
            priority: task.priority === "High" ? "Normal" : "High"
          })}
          className="text-xs font-bold px-2 py-1 rounded uppercase min-w-[60px]"
        >
          {task.priority === "High" ? "🔥 High" : "📌 Norm"}
        </button>

        {/* LOGIC: Show Input if Editing, otherwise show Text */}
        {isEditing ? (
          <input
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="bg-gray-800 text-white p-1 rounded border border-blue-500 outline-none flex-1"
            autoFocus
          />
        ) : (
          <span className={`font-medium ${task.priority === "High" ? "text-red-100" : "text-gray-200"}`}>
            {task.text}
          </span>
        )}
      </div>

      {/* RIGHT SIDE: Buttons */}
      <div className="flex gap-2 ml-4">
        {isEditing ? (
          // SAVE BUTTON
          <button onClick={handleSave} className="text-green-400 hover:text-green-300 text-sm font-bold">
            Save
          </button>
        ) : (
          // EDIT BUTTON
          <button onClick={() => setIsEditing(true)} className="text-blue-400 hover:text-blue-300 text-sm">
            Edit
          </button>
        )}

        {/* DELETE BUTTON */}
        <button onClick={() => onDelete(task.id)} className="text-gray-500 hover:text-red-500">
          ✕
        </button>
      </div>

    </div>
  );
}

export default TaskItem;
