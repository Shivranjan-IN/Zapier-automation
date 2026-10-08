"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
export default function SignupPage() {
    const router = useRouter()
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState("")

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        
    try {
         const response = await axios.post("http://localhost:3001/api/v1/user/signup",{
            username: email,
            name,
            password
         })
         console.log( "Signup successful:",response.data )
         setMessage(response.data.message)

         setLoading(false)
       setTimeout(() => {
            router.push("/login")
        }, 1500)
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error(
                "Signup failed:",
                error.response?.data
            )

            alert(
                error.response?.data?.message ||
                "Signup failed"
            )
        } else {
            console.error(error)
            alert("Something went wrong")
        }
    } finally {
        setLoading(false)
    }
    }
    

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#fffefb" }}>

            {/* Top nav */}
            <div className="flex items-center justify-between px-8 py-4 border-b border-gray-200">
                <div
                    className="text-2xl font-bold cursor-pointer select-none"
                    onClick={() => router.push("/")}
                >
                    _Zapier
                </div>
                <div className="text-sm text-gray-500">
                    Already have an account?{" "}
                    <button
                        onClick={() => router.push("/login")}
                        className="text-amber-600 font-semibold hover:underline cursor-pointer bg-transparent border-none"
                    >
                        Log in
                    </button>
                </div>
            </div>

            {/* Main content */}
            <div className="flex flex-1 items-center justify-center px-4 py-16">
                <div className="w-full max-w-md">

                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            Create your account
                        </h1>
                        <p className="text-gray-500 text-sm">
                            Start automating your work — free forever
                        </p>
                    </div>

                    {/* Card */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 px-8 py-10">

                        {/* Google OAuth */}
                        <button
                            id="signup-google"
                            onClick={() => router.push("/Contact")}
                            className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-full py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:shadow-sm transition-all cursor-pointer bg-white mb-6"
                        >
                            <svg width="18" height="18" viewBox="0 0 48 48">
                                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                            </svg>
                            Continue with Google
                        </button>

                        {/* Divider */}
                        <div className="flex items-center gap-4 mb-6">
                            <div className="flex-1 h-px bg-gray-200" />
                            <span className="text-xs text-gray-400 font-medium">OR</span>
                            <div className="flex-1 h-px bg-gray-200" />
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSignup} className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-gray-700">
                                    Full name
                                </label>
                                <input
                                    id="signup-name"
                                    type="text"
                                    required
                                    placeholder="Jane Smith"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition-all"
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-gray-700">
                                    Work email
                                </label>
                                <input
                                    id="signup-email"
                                    type="email"
                                    required
                                    placeholder="jane@company.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition-all"
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-gray-700">
                                    Password
                                </label>
                                <input
                                    id="signup-password"
                                    type="password"
                                    required
                                    minLength={8}
                                    placeholder="Min. 8 characters"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition-all"
                                />
                            </div>

                            <button
                                id="signup-submit"
                                type="submit"
                                disabled={loading}
                                className="mt-2 w-full bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white font-semibold rounded-full py-3 text-sm transition-all hover:shadow-md cursor-pointer"
                            >
                                {loading ? "Creating account…" : "Get started free"}
                            </button>
                        </form>

                        {/* Terms */}
                        <p className="text-xs text-gray-400 text-center mt-6 leading-relaxed">
                            By creating an account you agree to our{" "}
                            <span className="text-amber-600 hover:underline cursor-pointer">Terms of Service</span>
                            {" "}and{" "}
                            <span className="text-amber-600 hover:underline cursor-pointer">Privacy Policy</span>.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}  