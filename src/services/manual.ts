import axios from 'axios';

export const createManualSubsection = async (data: {
  section: string;
  subsection: string;
  description: string;
  position: 'before' | 'after';
}) => {
    return await axios.post('http://localhost:5555/api/v1/manual/subsection', data);
};
