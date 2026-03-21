import AddTaskInput from "@/components/AddTaskInput"

export default function NewTaskPage() {
  return (
    <div className="animate-fade-in">
      <div className="mb-6 animate-slide-up">
        <h1 className="text-3xl font-bold text-gradient">Add Task</h1>
        <p className="text-sm mt-1" style={{ color: "rgba(16, 185, 129, 0.5)" }}>
          What do you need to get done?
        </p>
      </div>
      <div className="animate-slide-up delay-100">
        <AddTaskInput />
      </div>
    </div>
  )
}
