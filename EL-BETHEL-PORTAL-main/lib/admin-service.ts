import { supabase } from "./supabase-client"

export async function createStudent(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  gender: string,
  dateOfBirth: string,
  classId: string,
  guardianName: string,
  guardianPhone: string,
  guardianEmail: string,
  address: string,
  session: string = "2024/2025"
) {
  try {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) throw authError
    if (!authData.user) throw new Error("Failed to create user account")

    // Create user record
    const { error: userError } = await supabase.from("users").insert([
      {
        id: authData.user.id,
        email,
        full_name: `${firstName} ${lastName}`,
        role: "student",
      },
    ])

    if (userError) throw userError

    // Generate registration number
    const regNumber = await generateStudentRegNumber(classId)

    // Create student record
    const { data: studentData, error: studentError } = await supabase
      .from("students")
      .insert([
        {
          user_id: authData.user.id,
          admission_number: `ADM${Date.now()}`,
          reg_number: regNumber,
          gender,
          date_of_birth: dateOfBirth,
          guardian_name: guardianName,
          guardian_phone: guardianPhone,
          guardian_email: guardianEmail,
          class_id: classId,
          session_admitted: session,
          status: "Active",
        },
      ])
      .select()
      .single()

    if (studentError) throw studentError

    return {
      success: true,
      data: {
        userId: authData.user.id,
        studentId: studentData.id,
        regNumber: regNumber,
        email,
      },
    }
  } catch (error: any) {
    console.error("Error creating student:", error)
    throw error
  }
}

export async function createTeacher(
  email: string,
  password: string,
  fullName: string,
  department: string,
  phoneNumber: string
) {
  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) throw authError
    if (!authData.user) throw new Error("Failed to create user account")

    const { error: userError } = await supabase.from("users").insert([
      {
        id: authData.user.id,
        email,
        full_name: fullName,
        role: "teacher",
        phone_number: phoneNumber,
      },
    ])

    if (userError) throw userError

    const teacherCode = `TCH${Date.now().toString().slice(-6)}`

    const { error: teacherError } = await supabase.from("teachers").insert([
      {
        user_id: authData.user.id,
        teacher_code: teacherCode,
        department,
      },
    ])

    if (teacherError) throw teacherError

    return {
      success: true,
      data: {
        userId: authData.user.id,
        teacherCode,
        email,
      },
    }
  } catch (error: any) {
    console.error("Error creating teacher:", error)
    throw error
  }
}

export async function getAllUsers(role?: string) {
  try {
    let query = supabase.from("users").select("*")

    if (role) {
      query = query.eq("role", role)
    }

    const { data, error } = await query

    if (error) throw error
    return data
  } catch (error: any) {
    console.error("Error fetching users:", error)
    throw error
  }
}

export async function getAllStudents() {
  try {
    const { data, error } = await supabase.from("students").select(
      `
      *,
      users(id, email, full_name, role),
      class:classes(name, form_level)
    `
    )

    if (error) throw error
    return data
  } catch (error: any) {
    console.error("Error fetching students:", error)
    throw error
  }
}

export async function getAllTeachers() {
  try {
    const { data, error } = await supabase.from("teachers").select(
      `
      *,
      users(id, email, full_name, role)
    `
    )

    if (error) throw error
    return data
  } catch (error: any) {
    console.error("Error fetching teachers:", error)
    throw error
  }
}

export async function updateUser(userId: string, updates: any) {
  try {
    const { error } = await supabase.from("users").update(updates).eq("id", userId)

    if (error) throw error
    return { success: true }
  } catch (error: any) {
    console.error("Error updating user:", error)
    throw error
  }
}

export async function suspendUser(userId: string) {
  try {
    const { error } = await supabase.from("users").update({ status: "suspended" }).eq("id", userId)

    if (error) throw error
    return { success: true }
  } catch (error: any) {
    console.error("Error suspending user:", error)
    throw error
  }
}

export async function deleteUser(userId: string) {
  try {
    // Delete from users table (cascade will handle related records)
    // Note: Supabase Auth deletion requires service role key, which is not available on client
    // Users will be effectively disabled since they won't have a profile in the users table
    const { error: dbError } = await supabase.from("users").delete().eq("id", userId)

    if (dbError) throw dbError
    return { success: true }
  } catch (error: any) {
    console.error("Error deleting user:", error)
    throw error
  }
}

export async function resetUserPassword(email: string) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email)

    if (error) throw error
    return { success: true }
  } catch (error: any) {
    console.error("Error resetting password:", error)
    throw error
  }
}

export async function getStudentProfile(studentId: string) {
  try {
    const { data, error } = await supabase
      .from("students")
      .select(
        `
      *,
      users(id, email, full_name),
      class:classes(name, form_level)
    `
      )
      .eq("id", studentId)
      .single()

    if (error) throw error
    return data
  } catch (error: any) {
    console.error("Error fetching student profile:", error)
    throw error
  }
}

export async function getStudentByRegNumber(regNumber: string) {
  try {
    const { data, error } = await supabase
      .from("students")
      .select(
        `
      *,
      users(id, email, full_name),
      class:classes(name, form_level)
    `
      )
      .eq("reg_number", regNumber)
      .single()

    if (error) throw error
    return data
  } catch (error: any) {
    console.error("Error fetching student by reg number:", error)
    throw error
  }
}

async function generateStudentRegNumber(classId: string): Promise<string> {
  const year = new Date().getFullYear().toString().slice(-2)

  const { data: classData } = await supabase.from("classes").select("form_level").eq("id", classId).single()

  const formLevel = classData?.form_level || "SS1"

  const { data: existingStudents } = await supabase
    .from("students")
    .select("reg_number")
    .like("reg_number", `ELBA/${year}/${formLevel}/%`)

  const count = (existingStudents?.length || 0) + 1
  const sequence = count.toString().padStart(3, "0")

  return `ELBA/${year}/${formLevel}/${sequence}`
}

export async function getAllClasses() {
  try {
    const { data, error } = await supabase.from("classes").select("*")

    if (error) throw error
    return data
  } catch (error: any) {
    console.error("Error fetching classes:", error)
    throw error
  }
}
