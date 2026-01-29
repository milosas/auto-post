import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <SignUp
        appearance={{
          elements: {
            // Match existing app styling (same as sign-in for consistency)
            formButtonPrimary:
              'bg-blue-600 hover:bg-blue-700 text-sm normal-case',
            card: 'shadow-lg rounded-lg',
            headerTitle: 'text-2xl font-bold text-gray-900',
            headerSubtitle: 'text-gray-600',
            socialButtonsBlockButton:
              'border border-gray-300 hover:bg-gray-50 text-gray-700',
            socialButtonsBlockButtonText: 'font-medium',
            formFieldLabel: 'text-sm font-medium text-gray-700',
            formFieldInput:
              'rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500',
            footerActionLink: 'text-blue-600 hover:text-blue-700',
            dividerLine: 'bg-gray-200',
            dividerText: 'text-gray-500 text-sm',
          },
        }}
      />
    </div>
  )
}
