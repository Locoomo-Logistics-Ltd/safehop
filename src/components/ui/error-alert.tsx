import { AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react";


interface Props {
  title:string;
  message:string;
  action?:string;
  success?:boolean;
}


export function ErrorAlert({
 title,
 message,
 action,
 success=false
}:Props){

return (
<div
className={`rounded-xl border p-4 mt-4 ${
success
? "border-green-300 bg-green-50"
: "border-red-300 bg-red-50"
}`}
>

<div className="flex gap-3">

{
success
?
<CheckCircle2 className="text-green-600"/>
:
<AlertCircle className="text-red-600"/>
}


<div>

<p className={`font-semibold text-sm ${
success
?"text-green-700"
:"text-red-700"
}`}>
{title}
</p>


<p className="text-sm mt-1 text-gray-700">
{message}
</p>


{
action &&
<p className="text-xs mt-2 font-medium text-gray-600 flex items-center gap-1">
<ArrowRight className="w-3 h-3 shrink-0" />
{action}
</p>
}


</div>

</div>


</div>
)

}