'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useUser, UserButton, SignInButton, SignUpButton } from '@clerk/nextjs'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { IconGitHub, IconSeparator } from '@/components/ui/icons'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useUserStore } from '@/lib/store/user-store'
import { Menu, PanelLeftClose, PanelLeftOpen, SquarePen, X } from 'lucide-react'

interface HeaderProps {
  isSidebarOpen: boolean
  setIsSidebarOpen: (open: boolean) => void
}

export function Header({ isSidebarOpen, setIsSidebarOpen }: HeaderProps) {
  const { isSignedIn, isLoaded } = useUser()
  const { user: dbUser, fetchUser, fetchSubscription } = useUserStore()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchUser()
      fetchSubscription()
    }
  }, [isLoaded, isSignedIn, fetchUser, fetchSubscription])

  const isPremium = dbUser?.subscriptionStatus === 'premium'

  return (
    <header className="fixed top-0 z-50 flex items-center justify-between w-full h-16 px-3 sm:px-4 border-b shrink-0 bg-gradient-to-b from-background/10 via-background/50 to-background/80 backdrop-blur-xl">
      <div className="flex items-center space-x-2">
        {isSignedIn && isPremium && (
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'sm' }),
              'h-8 w-8 p-0 flex-shrink-0'
            )}
            aria-label="Toggle sidebar"
          >
            {!isSidebarOpen ? (
              <PanelLeftOpen className="h-5 w-5" />
            ) : (
              <PanelLeftClose className="h-5 w-5" />
            )}
          </button>
        )}

        <Link href="/new" className="flex items-center">
          <Image
            src="/logo.png"
            alt="Pesito a Pesito Logo"
            width={90}
            height={27}
            className="w-[75px] h-auto sm:w-[90px]"
            priority
          />
        </Link>

        <div className="hidden sm:flex items-center font-semibold">
          <IconSeparator className="size-5 md:size-6 text-muted-foreground/50 ml-1" />
          <span className="hidden md:block ml-2 md:ml-4 whitespace-nowrap">
            Bot Bursátil y de Cambio de Moneda
          </span>
          <span className="sm:block md:hidden ml-2">Bot Bursátil</span>
          <IconSeparator className="size-5 md:size-6 text-muted-foreground/50 ml-2 md:ml-4" />
          <Link
            href={'/new'}
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'sm' }),
              'ml-1 h-8 px-2 md:px-3'
            )}
            style={{ borderRadius: 0, color: '#F55036' }}
          >
            <span className="flex justify-center items-center gap-x-2">
              Nuevo chat
              <SquarePen className="h-4 w-4" />
            </span>
          </Link>
        </div>
      </div>

      <div className="flex items-center">
        <div className="hidden sm:flex items-center space-x-1 md:space-x-2">
          <Link
            href="/pricing"
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'sm' }),
              'h-8 px-2 md:px-3'
            )}
          >
            {isSignedIn && isPremium ? (
              <span className="flex items-center">
                <span className="mr-1 size-2 rounded-full bg-green-500"></span>
                <span className="hidden md:inline">Premium</span>
                <span className="md:hidden">Pro</span>
              </span>
            ) : (
              <span className="whitespace-nowrap">Precios</span>
            )}
          </Link>

          <a
            target="_blank"
            href={process.env.NEXT_PUBLIC_REPO_URL}
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ variant: 'outline', size: 'sm' }),
              'h-8 hidden md:inline-flex'
            )}
            style={{ borderRadius: 0 }}
          >
            <IconGitHub />
            <span className="ml-2">GitHub</span>
          </a>

          {isLoaded && (
            <div>
              {isSignedIn ? null : (
                <div className="flex gap-1 md:gap-2">
                  <SignInButton mode="modal">
                    <button
                      className={cn(
                        buttonVariants({ variant: 'ghost', size: 'sm' }),
                        'h-8 px-2 md:px-3'
                      )}
                    >
                      <span className="hidden md:inline">Iniciar Sesión</span>
                      <span className="md:hidden">Entrar</span>
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button
                      className={cn(
                        buttonVariants({ variant: 'default', size: 'sm' }),
                        'h-8 px-2 md:px-3'
                      )}
                    >
                      <span className="hidden md:inline">Empieza ahora</span>
                      <span className="md:hidden">Unirse</span>
                    </button>
                  </SignUpButton>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile menu */}
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild className="sm:hidden ml-2">
            <button
              className="p-2 text-muted-foreground"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </SheetTrigger>

          <SheetContent
            side="right"
            className="w-[250px] sm:w-[300px] p-6 flex flex-col justify-between"
          >
            <div>
              <div className="mt-6 flex flex-col gap-4">
                <Link
                  href={'/new'}
                  className={cn(
                    buttonVariants({ variant: 'outline' }),
                    'w-full justify-start'
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <SquarePen className="mr-2 h-4 w-4" />
                  Nuevo chat
                </Link>

                <Link
                  href="/pricing"
                  className={cn(
                    buttonVariants({ variant: 'outline' }),
                    'w-full justify-start'
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {isSignedIn && isPremium ? (
                    <span className="flex items-center">
                      <span className="mr-2 size-2 rounded-full bg-green-500"></span>
                      Plan Premium
                    </span>
                  ) : (
                    'Ver planes'
                  )}
                </Link>

                <a
                  href={process.env.NEXT_PUBLIC_REPO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    buttonVariants({ variant: 'outline' }),
                    'w-full justify-start'
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <IconGitHub className="mr-2 h-4 w-4" />
                  GitHub
                </a>
              </div>
            </div>

            {!isSignedIn && (
              <div className="flex flex-col gap-2">
                <SignInButton mode="modal">
                  <button
                    className={cn(
                      buttonVariants({ variant: 'outline' }),
                      'w-full'
                    )}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Iniciar sesión
                  </button>
                </SignInButton>

                <SignUpButton mode="modal">
                  <button
                    className={cn(
                      buttonVariants({ variant: 'default' }),
                      'w-full'
                    )}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Registrarse
                  </button>
                </SignUpButton>
              </div>
            )}
          </SheetContent>
        </Sheet>

        {/* UserButton visible también en móvil */}
        {isSignedIn && isLoaded && (
          <div className="ml-2 sm:ml-4">
            <UserButton
              afterSignOutUrl="/restore"
              appearance={{
                elements: {
                  avatarBox: 'h-8 w-8'
                }
              }}
            />
          </div>
        )}
      </div>
    </header>
  )
}
