import { createFileRoute, redirect } from '@tanstack/react-router'

// Redirect shim — keeps existing /home references working
// (login-form, inspection save) without touching that code.
export const Route = createFileRoute('/_auth/home')({
  beforeLoad: () => {
    throw redirect({ to: '/' })
  },
  component: () => null,
})
