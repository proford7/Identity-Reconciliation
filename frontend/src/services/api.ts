/**
 * Axios-based API service for communicating with the backend.
 */

import axios from "axios";
import type { IdentifyRequest, IdentifyResponse } from "../types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

/**
 * Call the /identify endpoint with email and/or phoneNumber.
 */
export const identifyContact = async (
    data: IdentifyRequest
): Promise<IdentifyResponse> => {
    const response = await apiClient.post<IdentifyResponse>("/identify", data);
    return response.data;
};
