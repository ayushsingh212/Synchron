import axios from 'axios';
import React, { useEffect } from 'react'
import {  useParams } from 'react-router-dom'
import { API_BASE_URL } from '../../config';

export const ViewFaculty = () => {

const {facultyId} = useParams();

const getFacultyTimeTable = async () => {
  

  try {
    const res = axios.get(`${API_BASE_URL}/timetable/faculty/${facultyId}`,{
      withCredentials:true
    })
  
    console.log("Here is the res",res);

  } catch (error) {
    console.log("Here is the error",error)
  }
}

  useEffect(()=>{

  getFacultyTimeTable()


  },[])
  return (
    <div>
         




    </div>
  )
}

export default ViewFaculty
