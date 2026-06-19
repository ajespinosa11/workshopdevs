import AdminLoginForm from './form'

export default function AdminLogin() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="glass-card w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Staff Login</h1>
        <AdminLoginForm />
      </div>
    </div>
  )
}
