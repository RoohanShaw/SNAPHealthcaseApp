"use server";

import { ID, InputFile, Query } from "node-appwrite";

import {
  BUCKET_ID,
  DATABASE_ID,
  ENDPOINT,
  PATIENT_COLLECTION_ID,
  PROJECT_ID,
  databases,
  storage,
  users,
} from "../appwrite.config";
import { parseStringify } from "../utils";

// CREATE APPWRITE USER
export const createUser = async (user: CreateUserParams) => {
  try {
    // Create new user -> https://appwrite.io/docs/references/1.5.x/server-nodejs/users#create
    const newuser = await users.create(
      ID.unique(),
      user.email,
      user.phone,
      undefined,
      user.name
    );

    return parseStringify(newuser);
  } catch (error: any) {
    // Check existing user
    if (error && error?.code === 409) {
      const existingUser = await users.list([
        Query.equal("email", [user.email]),
      ]);

      return existingUser.users[0];
    }
    console.error("An error occurred while creating a new user:", error);
  }
};

// GET USER
export const getUser = async (userId: string) => {
  try {
    const user = await users.get(userId);

    return parseStringify(user);
  } catch (error) {
    console.error(
      "An error occurred while retrieving the user details:",
      error
    );
  }
};

// REGISTER PATIENT
export const registerPatient = async ({
  identificationDocument,
  ...patient
}: RegisterUserParams) => {
  try {
    let file;

    console.log("identificationDocument exists:", !!identificationDocument);

    if (identificationDocument) {
      console.log(
        "blobFile:",
        identificationDocument.get("blobFile")
      );

      console.log(
        "fileName:",
        identificationDocument.get("fileName")
      );

      const inputFile = InputFile.fromBlob(
        identificationDocument.get("blobFile") as Blob,
        identificationDocument.get("fileName") as string
      );

      console.log("InputFile created");

      try {
        file = await storage.createFile(
          BUCKET_ID!,
          ID.unique(),
          inputFile
        );

        console.log("FILE UPLOADED SUCCESSFULLY");
        console.log("FILE ID:", file.$id);

        console.log(
          "FILE URL:",
          `${ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${file.$id}/view?project=${PROJECT_ID}`
        );
      } catch (error) {
        console.error("FILE UPLOAD FAILED");
        console.error(error);
        throw error;
      }
    }

    const patientData = {
      name: patient.name,
      email: patient.email,
      phone: patient.phone,
      userId: patient.userId,
      privacyConsent: "true",
      birthDate: patient.birthDate,
      gender: patient.gender,
      address: patient.address,
      occupation: patient.occupation,
      emergencyContactName: patient.emergencyContactName,
      emergencyContactNumber: patient.emergencyContactNumber,
      primaryPhysician: patient.primaryPhysician,
      insuranceProvider: patient.insuranceProvider,
      insurancePolicyNumber: patient.insurancePolicyNumber,
      allergies: patient.allergies,
      currentMedication: patient.currentMedication,
      familyMedicalHistory: patient.familyMedicalHistory,
      pastMedicalHistory: patient.pastMedicalHistory,
      identificationType: patient.identificationType,
      identificationNumber: patient.identificationNumber,
      identificationDocumentId: "",
      identificationDocumentUrl: ""
    };

    console.log("DATABASE_ID:", DATABASE_ID);
    console.log("PATIENT_COLLECTION_ID:", PATIENT_COLLECTION_ID);

    console.log(
      "PATIENT DATA:",
      JSON.stringify(patientData, null, 2)
    );

    console.log("Attempting to create patient...");

    const collections = await databases.listCollections(DATABASE_ID!);

    const patientCollection = collections.collections.find(
      (c) => c.$id === "patient"
    );

    console.log(
      "PATIENT ATTRIBUTES:",
      patientCollection?.attributes?.map((a: any) => ({
        key: a.key,
        status: a.status,
        type: a.type,
      }))
    );

    const newPatient = await databases.createDocument(
      DATABASE_ID!,
      PATIENT_COLLECTION_ID!,
      ID.unique(),
      patientData
    );

    console.log("PATIENT CREATED:", newPatient.$id);

    return parseStringify(newPatient);
  } catch (error: any) {
    console.error("CREATE PATIENT FAILED");
    console.error("Message:", error?.message);
    console.error("Code:", error?.code);
    console.error("Type:", error?.type);
    console.error("Response:", error?.response);
    console.dir(error, { depth: null });

    throw error;
  }
};

// GET PATIENT
export const getPatient = async (userId: string) => {
  try {
    console.log("DATABASE_ID:", DATABASE_ID);
    console.log("PATIENT_COLLECTION_ID:", PATIENT_COLLECTION_ID);
    const patients = await databases.listDocuments(
      DATABASE_ID!,
      PATIENT_COLLECTION_ID!,
      [Query.equal("userId", [userId])]
    );
    if (!patients.documents.length) {
      console.log("No patient found for user:", userId);
      return null;
    }
    return parseStringify(patients.documents[0]);
  } catch (error) {
    console.error(
      "An error occurred while retrieving the patient details:",
      error
    );
  }
};
