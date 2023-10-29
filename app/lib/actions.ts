"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { sql } from "@vercel/postgres";

const InvoiceSchema = z.object({
    id: z.string(),
    customerId: z.string(),
    amount: z.coerce.number(),
    status: z.enum(['pending', 'paid']),
    date: z.string()
})

/**
 * ! Creating an invoice with server actions
 */

const CreateInvoice = InvoiceSchema.omit({ id: true, date: true });

export async function createInvoice(formData: FormData) {
    // const rawFormData = {
    //     customerId: formData.get('customerId'),
    //     amout: formData.get('amount'),
    //     status: formData.get('status')
    // }

    const rawFormData = Object.fromEntries(formData.entries());

    const { customerId, amount, status } = CreateInvoice.parse(rawFormData);

    /** it is always recommended to store monetary values in cents */
    const amountInCents = amount * 100;
    /** creating new dates for the invoice creation date with the format -- YYYY-MM-DD */
    const date = new Date().toISOString().split('T')[0];

    /** insert data into the database */
    await sql`
        INSERT INTO invoices (customer_id, amount, status, date)
        VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `
    // console.log(rawFormData)

    revalidatePath("/dashboard/invoices");
    redirect("/dashboard/invoices");
}

/**
 * ! Updating an invoice with server actions
 */

const UpdateInvoice = InvoiceSchema.omit({ date: true });

export async function updateInvoice(formData: FormData) {
    const { id, customerId, amount, status } = UpdateInvoice.parse({
        id: formData.get('id'),
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status')
    });

    const amountInCents = amount * 100;

    await sql`
        UPDATE invoices
        SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
        WHERE id = ${id}
    `;

    revalidatePath("/dashboard/invoices");
    redirect("/dashboard/invoices")
}