export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-md w-full mx-4">
        <div className="mb-6">
          <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AIGate AI 网关</h1>
          <p className="text-gray-600">智能 API 管理平台</p>
        </div>

        <div className="space-y-4">
          <a
            href="/login"
            className="block w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            登录管理后台
          </a>
          <a
            href="/register"
            className="block w-full bg-white text-indigo-600 border border-indigo-600 py-3 px-4 rounded-lg font-medium hover:bg-indigo-50 transition-colors"
          >
            注册新账户
          </a>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">© 2024 AIGate. 保留所有权利.</p>
        </div>
      </div>
    </div>
  );
}
