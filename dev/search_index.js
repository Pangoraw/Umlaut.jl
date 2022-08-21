var documenterSearchIndex = {"docs":
[{"location":"trace/","page":"Linearized traces","title":"Linearized traces","text":"CurrentModule = Umlaut","category":"page"},{"location":"trace/#Linearized-traces","page":"Linearized traces","title":"Linearized traces","text":"","category":"section"},{"location":"trace/#Tracing","page":"Linearized traces","title":"Tracing","text":"","category":"section"},{"location":"trace/","page":"Linearized traces","title":"Linearized traces","text":"Usually, programs are executed as a sequence of nested function calls, e.g.:","category":"page"},{"location":"trace/","page":"Linearized traces","title":"Linearized traces","text":"foo(x) = 2x\nbar(x, y) = foo(x) + 3y\nbaz(x, y) = bar(x, y) - 1\n\nbaz(1.0, 2.0)","category":"page"},{"location":"trace/","page":"Linearized traces","title":"Linearized traces","text":"Sometimes, however, it's more convenient to work with a linearized representation of the computation. Example use cases include collecting computational graphs for automatic differentiation, exporting to ONNX, serialization of functions to library-independent format, etc. trace() lets you obtain such a linearized representation:","category":"page"},{"location":"trace/","page":"Linearized traces","title":"Linearized traces","text":"foo(x) = 2x                # hide\nbar(x, y) = foo(x) + 3y    # hide\nbaz(x, y) = bar(x, y) - 1  # hide\n\nusing Umlaut\n\nval, tape = trace(baz, 1.0, 2.0)","category":"page"},{"location":"trace/","page":"Linearized traces","title":"Linearized traces","text":"trace() returns two values - the result of the original function call and the generated tape. The structure of the tape is described in Tape anatomy section, here just note that trace() recursed into baz(), bar() and foo(), but recorded +, - and * onto the tape as is. This is because +, - and * are considered \"primitives\", i.e. the most basic operations which all other functions consist of. This behavior can be customized using a tracing context.","category":"page"},{"location":"trace/#Context","page":"Linearized traces","title":"Context","text":"","category":"section"},{"location":"trace/","page":"Linearized traces","title":"Linearized traces","text":"Context is a way to customize tracing and attach arbitrary data to the generated tape. For example, here's how we can add a new function to the list of primitives:","category":"page"},{"location":"trace/","page":"Linearized traces","title":"Linearized traces","text":"foo(x) = 2x                # hide\nbar(x, y) = foo(x) + 3y    # hide\nbaz(x, y) = bar(x, y) - 1  # hide\n\nusing Umlaut                # hide\nimport Umlaut: isprimitive, BaseCtx\n\nstruct MyCtx end\n\nisprimitive(::MyCtx, f, args...) = isprimitive(BaseCtx(), f, args...) || f == foo\n\nval, tape = trace(baz, 1.0, 2.0; ctx=MyCtx())","category":"page"},{"location":"trace/","page":"Linearized traces","title":"Linearized traces","text":"In this code:","category":"page"},{"location":"trace/","page":"Linearized traces","title":"Linearized traces","text":"MyCtx is a new context type; there are no restrictions on the type of context\nisprimitive is a function that decides whether a particular function call f(args...) should be treated as a primitive in this context\nBaseCtx is the default context that treats all built-in functions from modules Base, Core, etc. as primitives","category":"page"},{"location":"trace/","page":"Linearized traces","title":"Linearized traces","text":"So we define a new method for isprimitive() that returns true for all built-in functions and for function foo.","category":"page"},{"location":"trace/","page":"Linearized traces","title":"Linearized traces","text":"isprimitive() can be artibtrarily complex. For example, if we want to include all functions from a particular module, we can write:","category":"page"},{"location":"trace/","page":"Linearized traces","title":"Linearized traces","text":"isprimitive(::MyCtx, f, args...) = Base.parentmodule(f) == Main","category":"page"},{"location":"trace/","page":"Linearized traces","title":"Linearized traces","text":"On the other hand, if we only need to set a few functions as primitives, BaseCtx() provides a convenient constructor for it:","category":"page"},{"location":"trace/","page":"Linearized traces","title":"Linearized traces","text":"foo(x) = 2x                # hide\nbar(x, y) = foo(x) + 3y    # hide\nbaz(x, y) = bar(x, y) - 1  # hide\n\nusing Umlaut                # hide\nimport Umlaut: isprimitive, BaseCtx  # hide\n\nval, tape = trace(baz, 1.0, 2.0; ctx=BaseCtx([+, -, *, foo]))","category":"page"},{"location":"trace/","page":"Linearized traces","title":"Linearized traces","text":"Another useful function is record_primitive!(), which lets you overload the way a primitive call is recorded to the tape. As a toy example, imagine that we want to replace all invokations of * with + and calculate the number of times it has been called. Even though we haven't learned tape anatomy and utils yet, try to parse this code:","category":"page"},{"location":"trace/","page":"Linearized traces","title":"Linearized traces","text":"using Umlaut     # hide\nimport Umlaut: record_primitive!\n\nfunction loop1(a, n)\n    a = 2a\n    for i in 1:n\n        a = a * n\n    end\n    return a\nend\n\nmutable struct CountingReplacingCtx\n    replace::Pair\n    count::Int\nend\n\n# v_fargs is a tuple of Variables or constant values, representing a function call\n# that we are about to invoke (but haven't yet)\nfunction record_primitive!(tape::Tape{CountingReplacingCtx}, v_fargs...)\n    # tape.c refers to the provided context\n    if v_fargs[1] == tape.c.replace[1]\n        tape.c.count += 1\n        return push!(tape, mkcall(tape.c.replace[2], v_fargs[2:end]...))\n    else\n        return push!(tape, mkcall(v_fargs...))\n    end\nend\n\n\n_, tape = trace(loop1, 2.0, 3; ctx=CountingReplacingCtx((*) => (+), 0))\n@assert tape.c.count == 4\n@assert count(op -> op isa Call && op.fn == (+), tape) == 4","category":"page"},{"location":"trace/","page":"Linearized traces","title":"Linearized traces","text":"Although we could have done it as a postprocessing using replace!(), record_primitive!() has advantage of running before the original function is invoked and thus avoiding double calculation.","category":"page"},{"location":"loops/","page":"Loops","title":"Loops","text":"Control flow tracing is not yet implemented. Please, come back later.","category":"page"},{"location":"loops/","page":"Loops","title":"Loops","text":"","category":"page"},{"location":"loops/","page":"Loops","title":"Loops","text":"if condition:","category":"page"},{"location":"loops/","page":"Loops","title":"Loops","text":"function cond1(x)\n    y = 2x\n    if x > 0\n        y = 3x\n    end\n    return y\nend","category":"page"},{"location":"loops/","page":"Loops","title":"Loops","text":"CodeInfo(\n1 ─      y = 2 * x\n│   %2 = x > 0\n└──      goto #3 if not %2\n2 ─      y = 3 * x\n3 ┄      return y\n)","category":"page"},{"location":"loops/","page":"Loops","title":"Loops","text":"while loop:","category":"page"},{"location":"loops/","page":"Loops","title":"Loops","text":"function while1(x)\n    y = 2x\n    while y > 0\n        y -= 1\n    end\n    return y\nend","category":"page"},{"location":"loops/","page":"Loops","title":"Loops","text":"CodeInfo(\n1 ─      y = 2 * x\n2 ┄ %2 = y > 0\n└──      goto #4 if not %2\n3 ─      y = y - 1\n└──      goto #2\n4 ─      return y\n)","category":"page"},{"location":"loops/","page":"Loops","title":"Loops","text":"loop with continue:","category":"page"},{"location":"loops/","page":"Loops","title":"Loops","text":"function while_continue(x)\n    y = 3x\n    while y > 0\n        if y < x\n            continue\n        end\n        y -= 1\n    end\n    return y\nend","category":"page"},{"location":"loops/","page":"Loops","title":"Loops","text":"CodeInfo(\n1 ─      y = 3 * x\n2 ┄ %2 = y > 0\n└──      goto #7 if not %2\n3 ─ %4 = y < x\n└──      goto #5 if not %4\n4 ─      goto #6\n5 ─      y = y - 1\n6 ┄      goto #2\n7 ─      return y\n)","category":"page"},{"location":"loops/","page":"Loops","title":"Loops","text":"loop with break:","category":"page"},{"location":"loops/","page":"Loops","title":"Loops","text":"function while_break(x)\n    y = 3x\n    while y > 0\n        if y < x\n            break\n        end\n        y -= 1\n    end\n    return y\nend","category":"page"},{"location":"loops/","page":"Loops","title":"Loops","text":"CodeInfo(\n1 ─      y = 3 * x\n2 ┄ %2 = y > 0\n└──      goto #6 if not %2\n3 ─ %4 = y < x\n└──      goto #5 if not %4\n4 ─      goto #6\n5 ─      y = y - 1\n└──      goto #2\n6 ┄      return y\n)","category":"page"},{"location":"ghost/","page":"Migration from Ghost","title":"Migration from Ghost","text":"CurrentModule = Umlaut","category":"page"},{"location":"ghost/#Migration-from-Ghost","page":"Migration from Ghost","title":"Migration from Ghost","text":"","category":"section"},{"location":"ghost/","page":"Migration from Ghost","title":"Migration from Ghost","text":"The default context is now BaseCtx instead of just Dict{Any,Any}(). BaseCtx can still be used as key-value storage, but allows more fine-grained control over tracing.","category":"page"},{"location":"ghost/","page":"Migration from Ghost","title":"Migration from Ghost","text":"Keyword arguments primitives and is_primitive to trace have been replaced with isprimitive(ctx, f, args...) function. As a convenient shortcut, one can set a list of functions as primitives using trace(f, args; ctx=BaseCtx(MY_PRIMITIVES)).","category":"page"},{"location":"ghost/","page":"Migration from Ghost","title":"Migration from Ghost","text":"Additionally, record_primitive!() has been introduced.","category":"page"},{"location":"ghost/","page":"Migration from Ghost","title":"Migration from Ghost","text":"using Umlaut imports much more stuff than using Ghost. In particular, you don't need to explicitely import things like Tape, Call, Variable, etc. You still need to import V (or alias const V = Variable) though.","category":"page"},{"location":"reference/","page":"Reference","title":"Reference","text":"CurrentModule = Umlaut","category":"page"},{"location":"reference/#Public-API","page":"Reference","title":"Public API","text":"","category":"section"},{"location":"reference/#Tracing","page":"Reference","title":"Tracing","text":"","category":"section"},{"location":"reference/","page":"Reference","title":"Reference","text":"trace\nisprimitive\nrecord_primitive!\nBaseCtx\n__new__","category":"page"},{"location":"reference/#Umlaut.trace","page":"Reference","title":"Umlaut.trace","text":"trace(f, args...; ctx=BaseCtx())\n\nTrace function call, return the result and the corresponding Tape. trace records to the tape primitive methods and recursively dives into non-primitives.\n\nTracing can be customized using a context and the following methods:\n\nisprimitive(ctx, f, args...) - decides whethere f(args...) should be treated as a primitive.\nrecordprimitive!(tape::Tape{C}, vf, vargs...) - records the primitive call defined by variables `fv(v_args...)` to the tape.\n\nThe default context is BaseCtx(), which treats all functions from standard Julia modules as primitives and simply pushes the call to the tape. See the docstrings of these functions for further examples of customization.\n\nExamples:\n\nfoo(x) = 2x\nbar(x) = foo(x) + 1\n\nval, tape = trace(bar, 2.0)\n# (5.0, Tape{Dict{Any, Any}}\n#   inp %1::typeof(bar)\n#   inp %2::Float64\n#   %3 = *(2, %2)::Float64\n#   %4 = +(%3, 1)::Float64\n# )\n\nval, tape = trace(bar, 2.0; ctx=BaseCtx([*, +, foo]))\n# (5.0, Tape{Dict{Any, Any}}\n#   inp %1::typeof(bar)\n#   inp %2::Float64\n#   %3 = foo(%2)::Float64\n#   %4 = +(%3, 1)::Float64\n# )\n\nstruct MyCtx end\n\nisprimitive(ctx::MyCtx, f, args...) = isprimitive(BaseCtx(), f, args...) || f in [foo]\nval, tape = trace(bar, 2.0; ctx=MyCtx())\n# (5.0, Tape{Dict{Any, Any}}\n#   inp %1::typeof(bar)\n#   inp %2::Float64\n#   %3 = foo(%2)::Float64\n#   %4 = +(%3, 1)::Float64\n# )\n\n\n\n\n\n","category":"function"},{"location":"reference/#Umlaut.isprimitive","page":"Reference","title":"Umlaut.isprimitive","text":"isprimitive(ctx::BaseCtx, f, args...)\n\nThe default implementation of isprimitive used in trace(). Returns true if the method with the provided signature is defined in one of the Julia's built-in modules, e.g. Base, Core, Broadcast, etc.\n\n\n\n\n\nisprimitive(ctx::Any, f, args...)\n\nFallback implementation of isprimitive(), behaves the same way as isprimitive(BaseCtx(), f, args...).\n\n\n\n\n\n","category":"function"},{"location":"reference/#Umlaut.record_primitive!","page":"Reference","title":"Umlaut.record_primitive!","text":"record_primitive!(tape::Tape{C}, v_fargs...) where C\n\nRecord a primitive function call to the tape.\n\nBy default, this function simply pushes the function call to the tape, but it can also be overwritten to do more complex logic. For example, instead of recording the function call, a user can push one or more other calls, essentially implementing replace!() right during the tracing and without calling the function twice.\n\nExamples:\n\nThe following code shows how to replace f(args...) with ChainRules.rrule(f, args...) duing the tracing:\n\nfunction record_primitive!(tape::Tape{RRuleContext}, v_fargs)\n    v_rr = push!(tape, mkcall(rrule, v_fargs...))\n    v_val = push!(tape, mkcall(getfield, v_rr, 1))\n    v_pb = push!(tape, mkcall(getfield, v_rr, 1))\n    tape.c.pullbacks[v_val] = v_pb\n    return v_val   # the function should return Variable with the result\nend\n\nSee also: isprimitive()\n\n\n\n\n\n","category":"function"},{"location":"reference/#Umlaut.BaseCtx","page":"Reference","title":"Umlaut.BaseCtx","text":"Dict-like tracing context that treats as primitives all functions from the standard Julia modules (e.g. Base, Core, Statistics, etc.)\n\n\n\n\n\n","category":"type"},{"location":"reference/#Umlaut.__new__","page":"Reference","title":"Umlaut.__new__","text":"__new__(T, args...)\n\nUser-level version of the new() pseudofunction. Can be used to construct most Julia types, including structs without default constructors, closures, etc.\n\n\n\n\n\n","category":"function"},{"location":"reference/#Variables","page":"Reference","title":"Variables","text":"","category":"section"},{"location":"reference/","page":"Reference","title":"Reference","text":"Variable\nbound\nrebind!\nrebind_context!","category":"page"},{"location":"reference/#Umlaut.Variable","page":"Reference","title":"Umlaut.Variable","text":"Variable represents a reference to an operation on a tape. Variables can be used to index tape or keep reference to a specific operation on the tape.\n\nVariables (also aliesed as V) can be:\n\nfree, created as V(id) - used for indexing into tape\nbound, created as V(op) or V(tape, id) - used to keep a robust reference to an operation on the tape\n\nSee also: bound\n\n\n\n\n\n","category":"type"},{"location":"reference/#Umlaut.bound","page":"Reference","title":"Umlaut.bound","text":"bound(tape::Tape, v::Variable)\nV(tape::Tape, v::Integer)\n%(tape::Tape, i::Integer)\n\nCreate version of the var bound to an operation on the tape. The short syntax tape %i is convenient for working in REPL, but may surprise a reader of your code. Use it wisely.\n\nExamples:\n\nV(3)                # unbound var\nV(tape, 3)          # bound var\nbound(tape, 3)      # bound var\nbound(tape, V(3))   # bound var\ntape %3             # bound var\n\n\n\n\n\n","category":"function"},{"location":"reference/#Umlaut.rebind!","page":"Reference","title":"Umlaut.rebind!","text":"rebind!(tape::Tape, op, st::Dict)\nrebind!(tape::Tape, st::Dict; from, to)\n\nRebind all variables according to substitution table. Example:\n\ntape = Tape()\nv1, v2 = inputs!(tape, nothing, 3.0, 5.0)\nv3 = push!(tape, mkcall(*, v1, 2))\nst = Dict(v1.id => v2.id)\nrebind!(tape, st)\n@assert tape[v3].args[1].id == v2.id\n\nSee also: rebind_context!()\n\n\n\n\n\n","category":"function"},{"location":"reference/#Umlaut.rebind_context!","page":"Reference","title":"Umlaut.rebind_context!","text":"rebind_context!(tape::Tape, st::Dict)\n\nRebind variables in the tape's context according to substitution table. By default does nothing, but can be overwitten for specific Tape{C}\n\n\n\n\n\n","category":"function"},{"location":"reference/#Tape-structure","page":"Reference","title":"Tape structure","text":"","category":"section"},{"location":"reference/","page":"Reference","title":"Reference","text":"Tape\nAbstractOp\nInput\nConstant\nCall\nLoop\ninputs\ninputs!\nmkcall","category":"page"},{"location":"reference/#Umlaut.Tape","page":"Reference","title":"Umlaut.Tape","text":"Linearized representation of a function execution.\n\nFields\n\nops - vector of operations on the tape\nresult - variable pointing to the operation to be used as the result\nparent - parent tape if any\nmeta - internal metadata\nc - application-specific context\n\n\n\n\n\n","category":"type"},{"location":"reference/#Umlaut.AbstractOp","page":"Reference","title":"Umlaut.AbstractOp","text":"Base type for operations on a tape\n\n\n\n\n\n","category":"type"},{"location":"reference/#Umlaut.Input","page":"Reference","title":"Umlaut.Input","text":"Operation representing input data of a tape\n\n\n\n\n\n","category":"type"},{"location":"reference/#Umlaut.Constant","page":"Reference","title":"Umlaut.Constant","text":"Operation representing a constant value on a tape\n\n\n\n\n\n","category":"type"},{"location":"reference/#Umlaut.Call","page":"Reference","title":"Umlaut.Call","text":"Operation represening function call on tape. Typically, calls are constructed using mkcall function.\n\nImportant fields of a Call{T}:\n\nfn::T - function or object to be called\nargs::Vector - vector of variables or values used as arguments\nval::Any - the result of the function call\n\n\n\n\n\n","category":"type"},{"location":"reference/#Umlaut.Loop","page":"Reference","title":"Umlaut.Loop","text":"Operation representing a loop in an computational graph. See the online documentation for details.\n\n\n\n\n\n","category":"type"},{"location":"reference/#Umlaut.inputs","page":"Reference","title":"Umlaut.inputs","text":"Get list of a tape input variables\n\n\n\n\n\n","category":"function"},{"location":"reference/#Umlaut.inputs!","page":"Reference","title":"Umlaut.inputs!","text":"Set values of a tape inputs\n\n\n\n\n\n","category":"function"},{"location":"reference/#Umlaut.mkcall","page":"Reference","title":"Umlaut.mkcall","text":"mkcall(fn, args...; val=missing, kwargs=(;))\n\nConvenient constructor for Call operation. If val is missing (default) and call value can be calculated from (bound) variables and constants, they are calculated. To prevent this behavior, set val to some neutral value.\n\n\n\n\n\n","category":"function"},{"location":"reference/#Tape-transformations","page":"Reference","title":"Tape transformations","text":"","category":"section"},{"location":"reference/","page":"Reference","title":"Reference","text":"push!\ninsert!\nreplace!\ndeleteat!\nprimitivize!","category":"page"},{"location":"reference/#Base.push!","page":"Reference","title":"Base.push!","text":"push!(tape::Tape, op::AbstractOp)\n\nPush a new operation to the end of the tape.\n\n\n\n\n\n","category":"function"},{"location":"reference/#Base.insert!","page":"Reference","title":"Base.insert!","text":"insert!(tape::Tape, idx::Integer, ops::AbstractOp...)\n\nInsert new operations into tape starting from position idx.\n\n\n\n\n\n","category":"function"},{"location":"reference/#Base.replace!","page":"Reference","title":"Base.replace!","text":"replace!(tape, op  => new_ops; rebind_to=length(new_ops), old_new=Dict())\n\nReplace specified operation with 1 or more other operations, rebind variables in the reminder of the tape to ops[rebind_to].\n\nOperation can be specified directly, by a variable or by ID.\n\n\n\n\n\n","category":"function"},{"location":"reference/#Base.deleteat!","page":"Reference","title":"Base.deleteat!","text":"deleteat!(tape::Tape, idx; rebind_to = nothing)\n\nRemove tape[V(idx)] from the tape. If rebind_to is not nothing, then replace all references to V(idx) with V(rebind_to).\n\nidx may be an index or Variable/AbstractOp directly.\n\n\n\n\n\n","category":"function"},{"location":"reference/#Umlaut.primitivize!","page":"Reference","title":"Umlaut.primitivize!","text":"primitivize!(tape::Tape; ctx=nothing)\n\nTrace non-primitive function calls on a tape and decompose them into a list of corresponding primitive calls.\n\nExample\n\nf(x) = 2x - 1\ng(x) = f(x) + 5\n\ntape = Tape()\n_, x = inputs!(tape, g, 3.0)\ny = push!(tape, mkcall(f, x))\nz = push!(tape, mkcall(+, y, 5))\ntape.result = z\n\nprimitivize!(tape)\n\n# output\n\nTape{BaseCtx}\n  inp %1::typeof(g)\n  inp %2::Float64\n  %3 = *(2, %2)::Float64\n  %4 = -(%3, 1)::Float64\n  %5 = +(%4, 5)::Float64\n\n\n\n\n\n","category":"function"},{"location":"reference/#Tape-execution","page":"Reference","title":"Tape execution","text":"","category":"section"},{"location":"reference/","page":"Reference","title":"Reference","text":"play!\ncompile\nto_expr","category":"page"},{"location":"reference/#Umlaut.play!","page":"Reference","title":"Umlaut.play!","text":"play!(tape::Tape, args...; debug=false)\n\nExecute operations on the tape one by one. If debug=true, print each operation before execution.\n\n\n\n\n\n","category":"function"},{"location":"reference/#Umlaut.compile","page":"Reference","title":"Umlaut.compile","text":"compile(tape::Tape)\n\nCompile tape into a normal Julia function.\n\n\n\n\n\n","category":"function"},{"location":"reference/#Umlaut.to_expr","page":"Reference","title":"Umlaut.to_expr","text":"to_expr(tape::Tape)\n\nGenerate a Julia expression corresponding to the tape.\n\n\n\n\n\n","category":"function"},{"location":"reference/#Index","page":"Reference","title":"Index","text":"","category":"section"},{"location":"reference/","page":"Reference","title":"Reference","text":"","category":"page"},{"location":"#Umlaut.jl","page":"Main","title":"Umlaut.jl","text":"","category":"section"},{"location":"","page":"Main","title":"Main","text":"Umlaut.jl is a code tracer for the Julia programming language. It lets you trace the function execution, recording all primitive operations onto a linearized tape. Here's a quick example:","category":"page"},{"location":"","page":"Main","title":"Main","text":"using Umlaut     # hide\ninc(x) = x + 1\nmul(x, y) = x * y\ninc_double(x) = mul(inc(x), inc(x))\n\nval, tape = trace(inc_double, 2.0)","category":"page"},{"location":"","page":"Main","title":"Main","text":"The tape can then be analyzed, modified and even compiled back to a normal function. See the following sections for details.","category":"page"},{"location":"","page":"Main","title":"Main","text":"note: Note\nUmlaut.jl was started as a fork of Ghost.jl trying to overcome some of its limitations, but eventually the codebase has diverged so much that the new package was born. Although the two have pretty similar API, there are several notable differences. See Migration from Ghost for details.","category":"page"},{"location":"tape/","page":"Tape anatomy","title":"Tape anatomy","text":"CurrentModule = Umlaut","category":"page"},{"location":"tape/#Tape-anatomy","page":"Tape anatomy","title":"Tape anatomy","text":"","category":"section"},{"location":"tape/#Operations","page":"Tape anatomy","title":"Operations","text":"","category":"section"},{"location":"tape/","page":"Tape anatomy","title":"Tape anatomy","text":"The very core of every tape is a list of operations. Let's take a look at one particular tape:","category":"page"},{"location":"tape/","page":"Tape anatomy","title":"Tape anatomy","text":"using Umlaut\n\nfoo(x) = 2x + 1\n_, tape = trace(foo, 2.0)\nprint(tape)","category":"page"},{"location":"tape/","page":"Tape anatomy","title":"Tape anatomy","text":"Each indented line in this output represents an operation. The first 2 designate the tape inputs and have type Input. Note that the traced function itself is also recorded as an input and can be referenced from other operations on the tape, which is a typical case in closures and other callable objects. We can set new inputs to the tape as inputs!(tape, foo, 3.0).","category":"page"},{"location":"tape/","page":"Tape anatomy","title":"Tape anatomy","text":"Operations 3 and 4 represent function calls and have type Call. For example, the notation %4 = +(%3, 1) means that variable %4 is equal to the addition of variable %3 and a constant 1 (we will talk about variables in a minute). The easiest way to construct this operation is by using mkcall.","category":"page"},{"location":"tape/","page":"Tape anatomy","title":"Tape anatomy","text":"Although constants can be used directly inside Calls, sometimes we need them as separate objects on the tape. Constant operation serves exactly this role.","category":"page"},{"location":"tape/","page":"Tape anatomy","title":"Tape anatomy","text":"Finally, there's an experimental Loop operation which presents whole loops in a computational graphs and contain their own subtapes.","category":"page"},{"location":"tape/#Variables","page":"Tape anatomy","title":"Variables","text":"","category":"section"},{"location":"tape/","page":"Tape anatomy","title":"Tape anatomy","text":"Variable (also aliased as just V) is a reference to  an operation on tape. Variables can be bound or unbound.","category":"page"},{"location":"tape/","page":"Tape anatomy","title":"Tape anatomy","text":"Unbound variables are constructed as V(id) and point to an operation by its position on a tape. Their primary use is for indexing and short-living handling, e.g.:","category":"page"},{"location":"tape/","page":"Tape anatomy","title":"Tape anatomy","text":"using Umlaut                 # hide\nimport Umlaut.V\nfoo(x) = 2x + 1             # hide\n_, tape = trace(foo, 2.0)   # hide\n\nop = tape[V(4)]","category":"page"},{"location":"tape/","page":"Tape anatomy","title":"Tape anatomy","text":"On the contrary, bound variables (created as V(op)) point to a specific operation on the tape. Even if the tape is modified, the reference is preserved. Here's an illustrative example:","category":"page"},{"location":"tape/","page":"Tape anatomy","title":"Tape anatomy","text":"using Umlaut                 # hide\nimport Umlaut: V, Constant   # hide\nfoo(x) = 2x + 1             # hide\n_, tape = trace(foo, 2.0)   # hide\n\nvu = V(4)         # unbound\nvb = V(tape[vu])  # bound, can also be created as `bound(tape, vu)`\n\n# insert a dummy operation\ninsert!(tape, 3, Constant(42))\nprintln(tape)\nprintln(\"Unbound variable is still $vu\")\nprintln(\"Bound variable is now $vb\")","category":"page"},{"location":"tape/","page":"Tape anatomy","title":"Tape anatomy","text":"Most functions in Umlaut create bound variables to make them resistant to transformations. Note, for example, how in the tape above the last operation automatically updated itself from +(%3, 1) to +(%4, 1). Yet sometimes explicit rebinding is neccessary, in which case rebind! can be used. Note that for rebind! to work properly with a user-defined tape context (see below), one must also implement rebind_context!","category":"page"},{"location":"tape/#Transformations","page":"Tape anatomy","title":"Transformations","text":"","category":"section"},{"location":"tape/","page":"Tape anatomy","title":"Tape anatomy","text":"Tapes can be modified in a variaty of ways. For this set of examples, we won't trace any function, but instead construct a tape manually:","category":"page"},{"location":"tape/","page":"Tape anatomy","title":"Tape anatomy","text":"using Umlaut\nimport Umlaut: Tape, V, inputs!, mkcall\n\ntape = Tape()\n# record inputs, using nothing instead of a function argument\nv1, v2, v3 = inputs!(tape, nothing, 1.0, 2.0)","category":"page"},{"location":"tape/","page":"Tape anatomy","title":"Tape anatomy","text":"push! is the standard way to add new operations to the tape, e.g.:","category":"page"},{"location":"tape/","page":"Tape anatomy","title":"Tape anatomy","text":"using Umlaut                             # hide\nimport Umlaut: Tape, V, inputs!, mkcall  # hide\ntape = Tape()                           # hide\nv1, v2, v3 = inputs!(tape, nothing, 1.0, 2.0)  # hide\n\nv4 = push!(tape, mkcall(*, v2, v3))\nprintln(tape)","category":"page"},{"location":"tape/","page":"Tape anatomy","title":"Tape anatomy","text":"insert! is similar to push!, but adds operation to the specified position:","category":"page"},{"location":"tape/","page":"Tape anatomy","title":"Tape anatomy","text":"using Umlaut                             # hide\nimport Umlaut: Tape, V, inputs!, mkcall  # hide\ntape = Tape()                           # hide\nv1, v2, v3 = inputs!(tape, nothing, 1.0, 2.0)  # hide\nv4 = push!(tape, mkcall(*, v2, v3))     # hide\n\nv5 = insert!(tape, 4, mkcall(-, v2, 1))  # inserted before v4\nprintln(tape)","category":"page"},{"location":"tape/","page":"Tape anatomy","title":"Tape anatomy","text":"replace! is useful when you need to replace an operation with one or more other operations.","category":"page"},{"location":"tape/","page":"Tape anatomy","title":"Tape anatomy","text":"using Umlaut                             # hide\nimport Umlaut: Tape, V, inputs!, mkcall  # hide\ntape = Tape()                           # hide\nv1, v2, v3 = inputs!(tape, nothing, 1.0, 2.0)  # hide\nv4 = push!(tape, mkcall(*, v2, v3))      # hide\nv5 = insert!(tape, 4, mkcall(-, v2, 1))  # hide\n\nnew_op1 = mkcall(/, V(2), 2)\nnew_op2 = mkcall(+, V(new_op1), 1)\nreplace!(tape, 4 => [new_op1, new_op2]; rebind_to=2)\nprintln(tape)","category":"page"},{"location":"tape/","page":"Tape anatomy","title":"Tape anatomy","text":"deleteat! is used to remove entries from the tape.","category":"page"},{"location":"tape/","page":"Tape anatomy","title":"Tape anatomy","text":"using Umlaut                             # hide\nimport Umlaut: Tape, V, inputs!, mkcall  # hide\ntape = Tape()                           # hide\n_, v1, v2 = inputs!(tape, nothing, 3.0, 5.0) # hide\nv3 = push!(tape, mkcall(*, v1, 2))      # hide\nv4 = push!(tape, mkcall(+, v3, v1))     # hide\nv5 = push!(tape, mkcall(+, v4, v2))     # hide\nv6 = push!(tape, mkcall(+, v4, v1))     # hide\n\ndeleteat!(tape, 5; rebind_to = 1)\nprintln(tape)","category":"page"},{"location":"tape/","page":"Tape anatomy","title":"Tape anatomy","text":"Although trace creates a tape consisting only of primitives, tape itself can hold any function calls. It's possible to decompose all non-primitive calls on the tape to lists of corresponding primitives using primitivize!.","category":"page"},{"location":"tape/","page":"Tape anatomy","title":"Tape anatomy","text":"using Umlaut                             # hide\nimport Umlaut: Tape, V, inputs!, mkcall  # hide\nimport Umlaut: primitivize!\n\nf(x) = 2x - 1\ng(x) = f(x) + 5\n\ntape = Tape()\n_, x = inputs!(tape, g, 3.0)\ny = push!(tape, mkcall(f, x))\nz = push!(tape, mkcall(+, y, 5))\ntape.result = z\n\nprimitivize!(tape)","category":"page"},{"location":"tape/#Tape-execution-and-compilation","page":"Tape anatomy","title":"Tape execution & compilation","text":"","category":"section"},{"location":"tape/","page":"Tape anatomy","title":"Tape anatomy","text":"There are 2 ways to execute a tape. For debug purposes it's easiest to run play!:","category":"page"},{"location":"tape/","page":"Tape anatomy","title":"Tape anatomy","text":"using Umlaut\nimport Umlaut: play!\n\nfoo(x) = 2x + 1\n_, tape = trace(foo, 2.0)\n\nplay!(tape, foo, 3.0)","category":"page"},{"location":"tape/","page":"Tape anatomy","title":"Tape anatomy","text":"compile turns the tape into a normal Julia function (subject to the World Age restriction):","category":"page"},{"location":"tape/","page":"Tape anatomy","title":"Tape anatomy","text":"using Umlaut\nimport Umlaut: compile\n\nfoo(x) = 2x + 1\n_, tape = trace(foo, 2.0)\n\nfoo2 = compile(tape)\nfoo2(foo, 3.0)   # note: providing the original `foo` as the 1st argument","category":"page"},{"location":"tape/","page":"Tape anatomy","title":"Tape anatomy","text":"It's possible to see what exactly is being compiled using to_expr function.","category":"page"},{"location":"tape/#Context-(again)","page":"Tape anatomy","title":"Context (again)","text":"","category":"section"},{"location":"tape/","page":"Tape anatomy","title":"Tape anatomy","text":"We have already discussed contexts as a way to customize tracing in the Linearized traces section, but here we need to emphasize context's role as a storage. Context is attached to a Tape and can be accessed throughout its lifetime. For instance, imagine that you are working on a DSL engine which traces function execution and enriches the resulting tape with domain-specific operations. You also want to keep track of all added operations, but don't want to pass around an additional object holding them. You can attach a custom context to the tape and reference it as tape.c:","category":"page"},{"location":"tape/","page":"Tape anatomy","title":"Tape anatomy","text":"using Umlaut\nimport Umlaut: Variable\n\ndsl_function(x) = ...\n\n\nmutable struct DSLContext\n    added_variables::Vector{Variable}\nend\n\n_, tape = trace(dsl_function, 2.0; ctx=DSLContext([]))\n\n\nfunction add_operations(tape::Tape{DSLContext})\n    v = push!(tape, ...)\n    push!(tape.c.added_variables, v)\n    ...\nend\n\nfunction process_dsl_tape(tape::Tape{DSLContext})\n    vars = tape.c.added_variables\n    ...\nend","category":"page"},{"location":"tape/","page":"Tape anatomy","title":"Tape anatomy","text":"Just to remind you, if your context contains variables and you plan to use rebind!, you must also implement rebind_context! for your specific context type.","category":"page"}]
}
