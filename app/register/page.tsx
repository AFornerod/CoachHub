'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Brain, Sparkles, Globe, DollarSign } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

// Especialidades que coinciden con el marketplace
const SPECIALIZATIONS = [
  'Coaching Ejecutivo',
  'Coaching de Vida',
  'Coaching de Carrera',
  'Salud y Bienestar',
  'Coaching de Negocios',
  'Desarrollo de Liderazgo',
  'Mindfulness',
  'Coaching de Relaciones',
  'Coaching Financiero',
  'Coaching de Desempeño',
]

const LANGUAGES = [
  'Español',
  'Inglés',
  'Portugués',
  'Francés',
  'Alemán',
  'Italiano',
  'Mandarín',
]

const COUNTRIES = [
  'Argentina',
  'Bolivia',
  'Brasil',
  'Chile',
  'Colombia',
  'Costa Rica',
  'Cuba',
  'Ecuador',
  'El Salvador',
  'España',
  'Guatemala',
  'Honduras',
  'México',
  'Nicaragua',
  'Panamá',
  'Paraguay',
  'Perú',
  'Puerto Rico',
  'República Dominicana',
  'Uruguay',
  'Venezuela',
]

export default function RegisterCoachPage() {
  // Datos básicos
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nationality, setNationality] = useState('')
  
  // Datos profesionales
  const [specializations, setSpecializations] = useState<string[]>([])
  const [languages, setLanguages] = useState<string[]>(['Español'])
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [bio, setBio] = useState('')
  const [yearsExperience, setYearsExperience] = useState('')
  
  // Precios
  const [minRate, setMinRate] = useState('')
  const [maxRate, setMaxRate] = useState('')
  const [currency, setCurrency] = useState('USD')
  
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const toggleSpecialization = (spec: string) => {
    setSpecializations(prev =>
      prev.includes(spec)
        ? prev.filter(s => s !== spec)
        : [...prev, spec]
    )
  }

  const toggleLanguage = (lang: string) => {
    setLanguages(prev =>
      prev.includes(lang)
        ? prev.filter(l => l !== lang)
        : [...prev, lang]
    )
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validaciones
    if (specializations.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Campos requeridos',
        description: 'Por favor selecciona al menos una especialización',
      })
      return
    }

    if (languages.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Campos requeridos',
        description: 'Por favor selecciona al menos un idioma',
      })
      return
    }

    if (!nationality) {
      toast({
        variant: 'destructive',
        title: 'Campo requerido',
        description: 'Por favor selecciona tu nacionalidad',
      })
      return
    }

    setIsLoading(true)

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            nationality,
          },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      })

      if (authError) {
        let errorMessage = authError.message
        if (authError.message.includes('User already registered')) {
          errorMessage = 'Este email ya está registrado. Por favor inicia sesión.'
        } else if (authError.message.includes('Password should be at least')) {
          errorMessage = 'La contraseña debe tener al menos 6 caracteres'
        }

        toast({
          variant: 'destructive',
          title: 'Error al registrarse',
          description: errorMessage,
        })
        return
      }

      if (authData.user) {
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Crear usuario en tabla users
        const { data: existingUser, error: checkError } = await supabase
          .from('users')
          .select('id')
          .eq('id', authData.user.id)
          .maybeSingle()

        if (!existingUser && !checkError) {
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              id: authData.user.id,
              email,
              full_name: name,
              role: 'coach',
              user_type: 'coach',
              subscription_plan: 'starter',
              subscription_status: 'trial',
            })

          if (insertError) {
            console.error('Error creating user profile:', insertError)
          }
        }

        // Crear o actualizar coach_profile con todos los datos
        await new Promise(resolve => setTimeout(resolve, 500))

        const sessionRate = minRate && maxRate 
          ? (parseFloat(minRate) + parseFloat(maxRate)) / 2
          : minRate ? parseFloat(minRate)
          : 0

        // Verificar si el perfil ya existe (creado por trigger)
        const { data: existingProfile } = await supabase
          .from('coach_profiles')
          .select('id')
          .eq('user_id', authData.user.id)
          .maybeSingle()

        const profileData = {
          display_name: name,
          tagline: `Coach profesional de ${specializations[0]}`,
          bio: bio || `Coach certificado con experiencia en ${specializations.join(', ')}`,
          specializations: specializations,
          languages: languages,
          years_experience: yearsExperience ? parseInt(yearsExperience) : 0,
          session_rate: sessionRate,
          currency: currency,
          linkedin_url: linkedinUrl || null,
          is_public: true,
          availability_status: 'available',
        }

        let profileError = null

        if (existingProfile) {
          // Actualizar perfil existente (creado por trigger)
          const { error } = await supabase
            .from('coach_profiles')
            .update(profileData)
            .eq('user_id', authData.user.id)
          
          profileError = error
          if (!error) {
            console.log('✅ Coach profile actualizado exitosamente')
          }
        } else {
          // Crear nuevo perfil si no existe
          const { error } = await supabase
            .from('coach_profiles')
            .insert({
              user_id: authData.user.id,
              ...profileData
            })
          
          profileError = error
          if (!error) {
            console.log('✅ Coach profile creado exitosamente')
          }
        }

        if (profileError) {
          console.error('Error con coach profile:', profileError)
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Hubo un problema al crear tu perfil de coach',
          })
          return
        }

        if (authData.session) {
          toast({
            title: '¡Bienvenido!',
            description: 'Tu cuenta de coach ha sido creada exitosamente',
          })
          router.push('/dashboard')
          router.refresh()
        } else {
          toast({
            title: 'Cuenta creada',
            description: 'Por favor verifica tu email para activar tu cuenta',
          })
          router.push('/login')
        }
      }
    } catch (error) {
      console.error('Registration error:', error)
      toast({
        variant: 'destructive',
        title: 'Error inesperado',
        description: 'Por favor intenta nuevamente',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12 px-4">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
      
      <div className="max-w-4xl mx-auto relative z-10">
        <Card className="border-purple-500/20 bg-slate-900/90 backdrop-blur-xl">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4">
              <Brain className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Registro de Coach Profesional
            </CardTitle>
            <CardDescription className="text-slate-300">
              Completa tu perfil para aparecer en el marketplace
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleRegister}>
            <CardContent className="space-y-6">
              {/* Sección 1: Datos Básicos */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-400" />
                  Datos Básicos
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-slate-200">Nombre Completo *</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Juan Pérez"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="bg-slate-800/50 border-slate-700 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nationality" className="text-slate-200">Nacionalidad *</Label>
                    <Select value={nationality} onValueChange={setNationality} required>
                      <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                        <SelectValue placeholder="Selecciona tu país" />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTRIES.map((country) => (
                          <SelectItem key={country} value={country}>
                            {country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-200">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="coach@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-slate-800/50 border-slate-700 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-200">Contraseña *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-slate-800/50 border-slate-700 text-white"
                  />
                </div>
              </div>

              {/* Sección 2: Perfil Profesional */}
              <div className="space-y-4 border-t border-slate-700 pt-6">
                <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-400" />
                  Perfil Profesional
                </h3>

                <div className="space-y-2">
                  <Label className="text-slate-200">Especializaciones * (selecciona al menos una)</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-slate-800/30 rounded-lg max-h-64 overflow-y-auto">
                    {SPECIALIZATIONS.map((spec) => (
                      <div key={spec} className="flex items-center space-x-2">
                        <Checkbox
                          id={spec}
                          checked={specializations.includes(spec)}
                          onCheckedChange={() => toggleSpecialization(spec)}
                          className="border-slate-600"
                        />
                        <Label
                          htmlFor={spec}
                          className="text-sm text-slate-300 cursor-pointer"
                        >
                          {spec}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-200 flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Idiomas * (selecciona al menos uno)
                    </Label>
                    <div className="space-y-2 p-4 bg-slate-800/30 rounded-lg max-h-48 overflow-y-auto">
                      {LANGUAGES.map((lang) => (
                        <div key={lang} className="flex items-center space-x-2">
                          <Checkbox
                            id={`lang-${lang}`}
                            checked={languages.includes(lang)}
                            onCheckedChange={() => toggleLanguage(lang)}
                            className="border-slate-600"
                          />
                          <Label
                            htmlFor={`lang-${lang}`}
                            className="text-sm text-slate-300 cursor-pointer"
                          >
                            {lang}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="experience" className="text-slate-200">
                      Años de Experiencia
                    </Label>
                    <Input
                      id="experience"
                      type="number"
                      min="0"
                      placeholder="5"
                      value={yearsExperience}
                      onChange={(e) => setYearsExperience(e.target.value)}
                      className="bg-slate-800/50 border-slate-700 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="linkedin" className="text-slate-200">
                    LinkedIn URL (opcional)
                  </Label>
                  <Input
                    id="linkedin"
                    type="url"
                    placeholder="https://linkedin.com/in/tu-perfil"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    className="bg-slate-800/50 border-slate-700 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-slate-200">
                    Biografía Breve (opcional)
                  </Label>
                  <Textarea
                    id="bio"
                    placeholder="Cuéntanos sobre tu experiencia y enfoque de coaching..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    className="bg-slate-800/50 border-slate-700 text-white"
                  />
                </div>
              </div>

              {/* Sección 3: Precios */}
              <div className="space-y-4 border-t border-slate-700 pt-6">
                <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-400" />
                  Rango de Precios por Sesión
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minRate" className="text-slate-200">Precio Mínimo</Label>
                    <Input
                      id="minRate"
                      type="number"
                      min="0"
                      placeholder="50"
                      value={minRate}
                      onChange={(e) => setMinRate(e.target.value)}
                      className="bg-slate-800/50 border-slate-700 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxRate" className="text-slate-200">Precio Máximo</Label>
                    <Input
                      id="maxRate"
                      type="number"
                      min="0"
                      placeholder="150"
                      value={maxRate}
                      onChange={(e) => setMaxRate(e.target.value)}
                      className="bg-slate-800/50 border-slate-700 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currency" className="text-slate-200">Moneda</Label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                        <SelectItem value="PYG">PYG (₲)</SelectItem>
                        <SelectItem value="ARS">ARS ($)</SelectItem>
                        <SelectItem value="MXN">MXN ($)</SelectItem>
                        <SelectItem value="CLP">CLP ($)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <p className="text-sm text-slate-400">
                  Si dejas los precios en blanco, se mostrará como "Consultar precio"
                </p>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <p className="text-sm text-slate-300">
                  <strong className="text-blue-300">Nota:</strong> Podrás editar toda esta información desde tu dashboard después de crear tu cuenta.
                </p>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold h-12"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando cuenta...
                  </>
                ) : (
                  <>
                    <Brain className="mr-2 h-4 w-4" />
                    Crear Cuenta de Coach
                  </>
                )}
              </Button>

              <div className="text-center text-sm text-slate-400">
                ¿Ya tienes cuenta?{' '}
                <Link href="/login" className="text-blue-400 hover:text-blue-300 font-semibold">
                  Inicia sesión
                </Link>
              </div>

              <div className="text-center text-sm text-slate-400">
                ¿Buscas un coach?{' '}
                <Link href="/register-client" className="text-purple-400 hover:text-purple-300 font-semibold">
                  Regístrate como cliente
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
