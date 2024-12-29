import { useSession } from '@clerk/nextjs';
import { error } from 'console';
import React, { useState } from 'react'

const useFetch = (cb, option = {}) => {
    const [loading, setLoading ] = useState<null | boolean>(null);
    const [eror, setError] = useState<any>(null);
    const [data, setData] = useState<null | string>(null);

    const {session} = useSession();

    const fn = async (...args) => {
        setLoading(true);
        try {
            const clerkAccessToken = await session?.getToken({template: 'supabase'});
            console.log(clerkAccessToken, "ClerkAccessToken")

            const response = await cb(supabaseAccessToken, options, ...args)
            setData(response);
            setError(null);

        } catch (error) {
            console.error("Error in supabase", error)
            setError(error)
        } finally{
            setLoading(true)
        }
    }
  return {data, error, loading, fn}
}

export default useFetch
