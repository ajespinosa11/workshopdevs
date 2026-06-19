import AdminLoginForm from '../../admin/login/form'

export default function ReceptionistLogin() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="glass-card w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Receptionist Login</h1>
        <AdminLoginForm />
      </div>
    </div>
  )
}
