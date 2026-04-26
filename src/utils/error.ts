import axios from "axios";

export function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data as
      | { message?: string; errors?: Array<{ msg?: string }> }
      | undefined;

    if (payload?.errors?.length) {
      return payload.errors.map((item) => item.msg).filter(Boolean).join(", ");
    }

    if (payload?.message) return payload.message;
  }

  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}
